import fs from 'fs/promises'
import path from 'path'
import type { Room } from './types'

const DB_PATH = path.join(process.cwd(), 'db.json')

interface Database {
  rooms: Record<string, Room>
}

async function getDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { rooms: {} }
  }
}

async function saveDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
}

export async function getRooms(): Promise<Room[]> {
  const db = await getDb()
  // Sort descending by created at
  return Object.values(db.rooms).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getRoom(code: string): Promise<Room | undefined> {
  const db = await getDb()
  return db.rooms[code.toUpperCase()]
}

export async function saveRoom(room: Room): Promise<void> {
  const db = await getDb()
  db.rooms[room.code.toUpperCase()] = room
  await saveDb(db)
}
