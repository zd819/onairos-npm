import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://api2.onairos.uk';

export const useAccountInfo = (NoAccount, NoModel) => {
  const [accountInfo, setAccountInfo] = useState(null);
  const [activeModels, setActiveModels] = useState([]);
  const [avatar, setAvatar] = useState(false);
  const [traits, setTraits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccountInfo = useCallback(async (identifier, isEmail = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isEmail ? '/getAccountInfo/email' : '/getAccountInfo';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`
        },
        body: JSON.stringify({
          identifier: identifier
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }

      const data = await response.json();
      
      if (data.AccountInfo === "No Account Found") {
        if (NoAccount?.current) NoAccount.current = true;
        setAccountInfo(null);
        return null;
      }

      // Update states
      setAccountInfo(data.AccountInfo);
      
      if (data.AccountInfo.models) {
        setActiveModels(data.AccountInfo.models);
      } else if (NoModel?.current) {
        NoModel.current = true;
      }

      if (data.AccountInfo.avatar) {
        setAvatar(true);
      }
      if (data.AccountInfo.traits) {
        setTraits(true);
      }

      return data.AccountInfo;
    } catch (error) {
      setError(error.message);
      console.error('Error fetching account info:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [NoAccount, NoModel]);

  // Clear account info
  const clearAccountInfo = useCallback(() => {
    setAccountInfo(null);
    setActiveModels([]);
    setAvatar(false);
    setTraits(false);
    setError(null);
  }, []);

  return {
    accountInfo,
    activeModels,
    setActiveModels,
    avatar,
    setAvatar,
    traits,
    setTraits,
    loading,
    error,
    fetchAccountInfo,
    clearAccountInfo
  };
}; 