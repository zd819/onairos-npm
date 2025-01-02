"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useAccountInfo = void 0;
var _react = require("react");
const API_URL = process.env.REACT_APP_API_URL || 'https://api2.onairos.uk';
const useAccountInfo = (NoAccount, NoModel) => {
  const [accountInfo, setAccountInfo] = (0, _react.useState)(null);
  const [activeModels, setActiveModels] = (0, _react.useState)([]);
  const [avatar, setAvatar] = (0, _react.useState)(false);
  const [traits, setTraits] = (0, _react.useState)(false);
  const [loading, setLoading] = (0, _react.useState)(false);
  const [error, setError] = (0, _react.useState)(null);
  const fetchAccountInfo = (0, _react.useCallback)(async function (identifier) {
    let isEmail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
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
  const clearAccountInfo = (0, _react.useCallback)(() => {
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
exports.useAccountInfo = useAccountInfo;