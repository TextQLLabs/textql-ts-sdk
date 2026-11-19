import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { RegistrationRecord } from '../src/lib/registration';

/**
 * Registrations persist to a JSON file next to the example. In production this
 * is your registry of record; the TextQL agent only exists once a registration
 * is approved, and its ID is written back here.
 */
const FILE = path.resolve('data', 'registrations.json');

let writes: Promise<unknown> = Promise.resolve();

export async function listRecords(): Promise<RegistrationRecord[]> {
	try {
		return JSON.parse(await readFile(FILE, 'utf8')) as RegistrationRecord[];
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
}

export async function findRecord(id: string): Promise<RegistrationRecord | null> {
	return (await listRecords()).find((record) => record.id === id) ?? null;
}

/** Inserts or replaces `record` by ID. Writes are serialized so concurrent requests don't drop each other. */
export function saveRecord(record: RegistrationRecord): Promise<RegistrationRecord> {
	const write = writes.then(async () => {
		const records = (await listRecords()).filter((existing) => existing.id !== record.id);
		records.push(record);
		await mkdir(path.dirname(FILE), { recursive: true });
		await writeFile(FILE, JSON.stringify(records, null, 2));
		return record;
	});
	writes = write.catch(() => undefined);
	return write;
}
