import React, { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import { getOrCreateKeyPair, signMessage, encodeBase64 } from './Identity';
import FollowUsers from './FollowUsers';
import { useFeed } from './useFeed';


function App() {
  const [ipfs, setIpfs] = useState(null);
  const [status, setStatus] = useState('Connecting to IPFS...');
  const [cid, setCid] = useState('');
  const [postContent, setPostContent] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [followedUsers, setFollowedUsers] = useState(() => {
    const saved = localStorage.getItem('followedUsers');
    return saved ? JSON.parse(saved) : [];
  });

  const { posts, addPostCID } = useFeed(ipfs, followedUsers);

  useEffect(() => {
    const connectToIpfs = async () => {
      try {
        const client = create({ url: 'http://127.0.0.1:5001/api/v0' });
        setIpfs(client);
        setStatus('Connected to IPFS ✅');

        const keyPair = await getOrCreateKeyPair();
        setPublicKey(encodeBase64(keyPair.publicKey));
      } catch (err) {
        console.error('IPFS connection error:', err);
        setStatus('Failed to connect to IPFS ❌');
      }
    };
    connectToIpfs();
  }, []);

  useEffect(() => {
    localStorage.setItem('followedUsers', JSON.stringify(followedUsers));
  }, [followedUsers]);

  const handleFollowUsersChange = (newFollowedUsers) => {
    setFollowedUsers(newFollowedUsers);
  };

  const handleDeleteUser = (userToDelete) => {
    const updated = followedUsers.filter(user => user !== userToDelete);
    setFollowedUsers(updated);
  };

  const handlePost = async () => {
    if (!postContent.trim()) return alert('Post content cannot be empty.');

    try {
      const keyPair = await getOrCreateKeyPair();
      const timestamp = Date.now();
      const authorKey = encodeBase64(keyPair.publicKey);

      const post = {
        content: postContent,
        author: authorKey,
        timestamp,
      };

      const postString = JSON.stringify(post);
      const signature = encodeBase64(signMessage(postString, keyPair.secretKey));
      const signedPost = { ...post, signature };

      const { cid } = await ipfs.add(JSON.stringify(signedPost));
      const cidStr = cid.toString();

      setCid(cidStr);
      setPostContent('');
      setStatus('Post uploaded to IPFS ✅');

      addPostCID(authorKey, cidStr);
    } catch (err) {
      console.error('Error posting to IPFS:', err);
      setStatus('Failed to upload post ❌');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>IPFS Social Post</h1>
      <p>Status: <strong>{status}</strong></p>
      <p>
        <strong>Your Public Key:</strong><br />
        <code style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>{publicKey || 'Loading...'}</code>
      </p>

      <textarea
        rows={4}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
        placeholder="Write your post here..."
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      />
      <button onClick={handlePost} disabled={!ipfs} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Post to IPFS
      </button>

      {cid && (
        <p style={{ marginTop: '1rem' }}>
          <strong>Latest post CID:</strong><br />
          <code>{cid}</code><br />
          <a href={`https://ipfs.io/ipfs/${cid}`} target="_blank" rel="noreferrer">
            View on IPFS ↗
          </a>
        </p>
      )}

      <h2 style={{ marginTop: '2rem' }}>Followed Users</h2>
      <FollowUsers followedUsers={followedUsers} onChange={handleFollowUsersChange} />
      <ul>
        {followedUsers.map((user) => (
          <li key={user} style={{ marginBottom: '0.5rem' }}>
            <code>{user}</code>
            <button
              onClick={() => handleDeleteUser(user)}
              style={{
                marginLeft: '1rem',
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Unfollow
            </button>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: '2rem' }}>Feed from Followed Users</h2>
      {posts.length === 0 && <p>No posts yet</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(({ cid, content, author, timestamp, signature }) => (
          <li
            key={cid}
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <p>{content}</p>
            <p><small><strong>Author:</strong> <code>{author}</code></small></p>
            <p><small><strong>Timestamp:</strong> {new Date(timestamp).toLocaleString()}</small></p>
            <p><small><strong>Signature:</strong> <code>{signature}</code></small></p>
            <a href={`https://ipfs.io/ipfs/${cid}`} target="_blank" rel="noreferrer">
              View Post ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
