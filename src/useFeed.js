import { useEffect, useState, useCallback } from "react";
import { fetchPostByCID } from "./ipfsUtils";

/**
 * Custom React hook to manage feed from followed users.
 * Tracks known post CIDs per user in localStorage.
 * Fetches posts from IPFS by CID and returns combined timeline.
 * 
 * @param {IPFS|null} ipfs - ipfs-http-client instance
 * @param {string[]} followedUsers - array of followed user public keys (base64 strings)
 * @returns {object} { posts: Array<Post>, addPostCID: function }
 */
export function useFeed(ipfs, followedUsers) {
  // Store known post CIDs per user: { [publicKey]: string[] }
  const [userPostCIDs, setUserPostCIDs] = useState(() => {
    try {
      const saved = localStorage.getItem("userPostCIDs");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // All fetched posts from IPFS
  const [posts, setPosts] = useState([]);

  // Save userPostCIDs to localStorage on change
  useEffect(() => {
    localStorage.setItem("userPostCIDs", JSON.stringify(userPostCIDs));
  }, [userPostCIDs]);

  // Helper to add a post CID for a user and update localStorage
  const addPostCID = useCallback((publicKey, cid) => {
    setUserPostCIDs((prev) => {
      const userCIDs = prev[publicKey] || [];
      if (userCIDs.includes(cid)) return prev; // avoid duplicates
      return {
        ...prev,
        [publicKey]: [...userCIDs, cid],
      };
    });
  }, []);

  // Effect: Whenever ipfs client or followedUsers or known post CIDs change, fetch posts
  useEffect(() => {
    if (!ipfs || followedUsers.length === 0) {
      setPosts([]);
      return;
    }

    let cancelled = false;

    async function fetchAllPosts() {
      const allPosts = [];

      for (const user of followedUsers) {
        const cids = userPostCIDs[user] || [];

        // Fetch all posts for this user by CID
        for (const cid of cids) {
          const post = await fetchPostByCID(ipfs, cid);
          if (post && post.author === user) {
            allPosts.push({ ...post, cid });
          }
        }
      }

      if (!cancelled) {
        // Sort posts by timestamp descending (newest first)
        allPosts.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(allPosts);
      }
    }

    fetchAllPosts();

    return () => {
      cancelled = true;
    };
  }, [ipfs, followedUsers, userPostCIDs]);

  return { posts, addPostCID };
}
