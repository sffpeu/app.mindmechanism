import { updateDoc, type DocumentReference } from 'firebase/firestore'
import { decryptField, encryptField, generatePassportKey } from '@/lib/passportCrypto'

export async function rotatePassportKey(
  oldKey: CryptoKey,
  getAllEncryptedData: () => Promise<Array<{ ref: DocumentReference; fields: Record<string, string> }>>
): Promise<CryptoKey> {
  const newKey = await generatePassportKey()
  const records = await getAllEncryptedData()
  await Promise.all(
    records.map(async ({ ref, fields }) => {
      const reEncrypted: Record<string, string> = {}
      for (const [field, ciphertext] of Object.entries(fields)) {
        const plain = await decryptField(ciphertext, oldKey)
        reEncrypted[field] = await encryptField(plain, newKey)
      }
      await updateDoc(ref, reEncrypted)
    })
  )
  return newKey
}
