import express, { Request, Response } from 'express'
import ping from 'ping'
import bodyParser from 'body-parser'

const app = express()

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

// Основная функция
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

// Пинг одного адреса или всей подсети
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

// Запуск сервера
app.listen(3005, () => {
    console.log('The server is running on http://localhost:3005')
})
