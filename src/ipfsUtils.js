/**
 * Helper: Fetch JSON post data from IPFS by CID
 * @param {IPFS} ipfs - ipfs-http-client instance
 * @param {string} cid - content identifier
 * @returns {Promise<object|null>} parsed JSON object or null if failure
 */
export async function fetchPostByCID(ipfs, cid) {
    try {
      if (!ipfs) throw new Error("IPFS client not connected");
      const chunks = [];
      for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      // Buffer.concat works with Uint8Array chunks
      const buffer = Buffer.concat(chunks);
      const jsonString = new TextDecoder().decode(buffer);
      return JSON.parse(jsonString);
    } catch (err) {
      console.error(`Failed to fetch post ${cid} from IPFS:`, err);
      return null;
    }
  }
  