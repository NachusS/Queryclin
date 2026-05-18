export function selectLatestSnapshots<T extends { nhc: string; date?: number; idToma?: string; ordenToma?: number }>(
  records: T[]
): T[] {
  if (!records || records.length === 0) return [];

  const snapshotMap = new Map<string, T>();

  for (const currentRecord of records) {
    const nhc = currentRecord.nhc;
    if (!nhc) {
      continue;
    }

    const existingRecord = snapshotMap.get(nhc);

    if (!existingRecord) {
      snapshotMap.set(nhc, currentRecord);
      continue;
    }

    const currentDate = currentRecord.date || 0;
    const existingDate = existingRecord.date || 0;

    if (currentDate > existingDate) {
      snapshotMap.set(nhc, currentRecord);
    } else if (currentDate === existingDate) {
      const currentId = currentRecord.idToma || '';
      const existingId = existingRecord.idToma || '';

      if (currentId > existingId) {
        snapshotMap.set(nhc, currentRecord);
      } else if (currentId === existingId) {
        const currentOrder = Number(currentRecord.ordenToma) || 0;
        const existingOrder = Number(existingRecord.ordenToma) || 0;

        if (currentOrder > existingOrder) {
          snapshotMap.set(nhc, currentRecord);
        }
      }
    }
  }

  return Array.from(snapshotMap.values());
}
