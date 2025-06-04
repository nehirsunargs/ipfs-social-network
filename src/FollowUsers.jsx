import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'followedPublicKeys';

function FollowUsers() {
  const [inputKey, setInputKey] = useState('');
  const [followedKeys, setFollowedKeys] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFollowedKeys(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(followedKeys));
  }, [followedKeys]);

  const addKey = () => {
    if (!inputKey) return;
    if (followedKeys.includes(inputKey)) {
      alert('You already follow this public key!');
      return;
    }
    setFollowedKeys([...followedKeys, inputKey]);
    setInputKey('');
  };

  const removeKey = (keyToRemove) => {
    setFollowedKeys(followedKeys.filter((key) => key !== keyToRemove));
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial', marginTop: '2rem', borderTop: '1px solid #ccc' }}>
      <h2>Follow Users</h2>
      <input
        type="text"
        placeholder="Enter public key to follow"
        value={inputKey}
        onChange={(e) => setInputKey(e.target.value.trim())}
        style={{ width: '300px', marginRight: '0.5rem' }}
      />
      <button onClick={addKey}>Follow</button>

      <h3>Followed Public Keys</h3>
      {followedKeys.length === 0 && <p>No users followed yet.</p>}
      <ul>
        {followedKeys.map((key) => (
          <li key={key} style={{ marginBottom: '0.5rem' }}>
            <code>{key}</code>{' '}
            <button onClick={() => removeKey(key)} style={{ marginLeft: '1rem' }}>
              Unfollow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FollowUsers;
