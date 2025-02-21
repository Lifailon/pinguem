import express, { Request, Response } from 'express'
import ping from 'ping'
import bodyParser from 'body-parser'
import morgan from 'morgan'

const app = express()

// Логируем запросы
app.use(morgan('combined'))

// Middleware для JSON
app.use(bodyParser.json())

// CORS заголовки для работы frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    next()
})

// Хранилище для статистики пингов
const pingResults: { [key: string]: PingResult } = {}

// Тип для результатов пинга
interface PingResult {
    host: string
    time: string | number | null
    status: 'Available' | 'Unavailable' | 'Error'
    lastAvailable: string | null
    lastUnavailable: string | null
    successful: number
    failed: number
}

// Основная функция для выполнения ping и сохранения результатов
async function pingHost(host: string): Promise<PingResult> {
    const currentTime = new Date().toISOString()
    try {
        const result = await ping.promise.probe(host, {
            timeout: 1
        })
        // Если хранимые результаты существуют, обновляем их
        if (pingResults[host]) {
            // Обновляем время ответа
            pingResults[host].time = result.time ?? 'N/A'
            // Проверяем и обновляем статус
            pingResults[host].status = result.alive ? 'Available' : 'Unavailable'
            // Если результат успешный, фиксируем текущее время, или возвращаем последнюю дату, когда был доступ
            pingResults[host].lastAvailable = result.alive ? currentTime : pingResults[host].lastAvailable
            pingResults[host].lastUnavailable = !result.alive ? currentTime : pingResults[host].lastUnavailable
            // Обновляем счетчики успешных и неуспешных пингов
            if (result.alive) {
                pingResults[host].successful++
            } else {
                pingResults[host].failed++
            }
        }
        // Добавляем в хранилище новый хост с начальными значениями
        else {
            pingResults[host] = {
                host: host,
                time: result.time,
                status: result.alive ? 'Available' : 'Unavailable',
                lastAvailable: result.alive ? currentTime : null,
                lastUnavailable: result.alive ? null : currentTime,
                successful: result.alive ? 1 : 0,
                failed: result.alive ? 0 : 1,
            }
        }
        return pingResults[host]
    }
    catch (error) {
        return {
            host: host,
            time: 'n/a',
            status: 'Error',
            lastAvailable: 'n/a',
            lastUnavailable: currentTime,
            successful: 0,
            failed: 1,
        }
    }
}

// Конечная точка для пинга одного адреса или всей подсети
app.post('/ping', async (req: Request, res: Response) => {
    const { addresses }: { addresses: string[] } = req.body
    const promises: Promise<PingResult>[] = []
    // Проверяем, что полученные данные в теле запроса не пустые или являются массивом
    if (!addresses || addresses.length === 0 || !Array.isArray(addresses)) {
        return res.status(400).json({ error: 'Address is required.' })
    }
    for (const address of addresses) {
        // Проверка на подсеть
        if (address.endsWith('.0')) {
            let subnet = address.split('.').slice(0, 3) 
            if (subnet.length === 3) {
                const subnetStr = subnet.join('.')
                for (let i = 1; i <= 254; i++) {
                    const host = `${subnetStr}.${i}`
                    promises.push(pingHost(host))
                }
            }
        }
        // Один IP-адрес
        else {
            promises.push(pingHost(address))
        }
    }
    // Ожидание выполнения всех пингов
    const results = await Promise.all(promises)
    res.json(results)
})

// Конечная точка для очистки данных счетчиков
app.post('/reset', (req: Request, res: Response) => {
    const { addresses }: { addresses: string[] } = req.body
    if (!addresses || !Array.isArray(addresses)) {
        return res.status(400).json({ error: 'Addresses are required.' })
    }
    for (const address of addresses) {
        if (pingResults[address]) {
            delete pingResults[address]
        }
        else if (address.endsWith('.0')) {
            let subnet = address.split('.').slice(0, 3)
            if (subnet.length === 3) {
                const subnetStr = subnet.join('.')
                for (let i = 1; i <= 254; i++) {
                    const host = `${subnetStr}.${i}`
                    if (pingResults[host]) {
                        delete pingResults[host]
                    }
                }
            }
        }
    }
    res.json({ message: 'Ping results have been reset.' })
})

// Конечная точка для получения результатов пинга
app.get('/result', (req: Request, res: Response) => {
    res.json(pingResults)
})

// Конечная точка для метрик Prometheus с параметром подсети (/metrics/192.168.3.0)
app.get('/metrics/:subnet', async (req: Request, res: Response) => {
    // Извлекаем подсеть из пути
    const subnet = req.params.subnet
    // Проверка валидность параметра из пути
    if (!subnet || !subnet.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return res.status(400).json({ error: 'Invalid subnet format.' })
    }
    // Переменные для хранения метрик
    let active = 0
    let inactive = 254
    // Извлекаем первые 3 октета
    const subnetParts = subnet.split('.').slice(0, 3).join('.')
    // Объект для хранения статусов всех хостов (по умолчанию 0)
    const hostsStatus: Record<string, number> = {}
    // По умолчанию все хосты недоступны
    for (let i = 1; i <= 254; i++) {
        const host = `${subnetParts}.${i}`
        hostsStatus[host] = 0
    }
    // Пингуем подсеть
    const promises: Promise<any>[] = []
    for (const host in hostsStatus) {
        promises.push(
            ping.promise.probe(host, { timeout: 1 }).then((result) => {
                // Если хост активен, меняем его статус на 1 и обновляем статусы
                if (result.alive) {
                    hostsStatus[host] = 1
                    active++
                    inactive--
                }
            })
        )
    }
    // Ожидаем завершения всех пингов
    await Promise.all(promises)
    // Формируем ответ
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.end(`# HELP active_hosts_count Number of active hosts in the subnet
# TYPE active_hosts_count gauge
active_hosts_count{subnet="${subnet}"} ${active}
# HELP inactive_hosts_count Number of inactive hosts in the subnet
# TYPE inactive_hosts_count gauge
inactive_hosts_count{subnet="${subnet}"} ${inactive}
# HELP status_hosts_list List of active and inactive hosts
# TYPE status_hosts_list gauge
${Object.entries(hostsStatus)
    .map(([host, status]) => `status_hosts_list{host="${host}",subnet="${subnet}"} ${status}`)
    .join('\n')}
`)
})

// Запуск сервера
app.listen(3005, '0.0.0.0', () => {
    console.log('The server is running on 3005 port')
})
