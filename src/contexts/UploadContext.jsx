import { createContext, useState, useContext } from 'react';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    uploadProgress: {},
    uploadResults: [],
    currentFileIndex: 0,
    totalFilesCount: 0,
    uploadController: null
  });

  const updateUploadState = (updates) => {
    setUploadState(prev => ({ ...prev, ...updates }));
  };

  const resetUploadState = () => {
    setUploadState({
      isUploading: false,
      uploadProgress: {},
      uploadResults: [],
      currentFileIndex: 0,
      totalFilesCount: 0,
      uploadController: null
    });
  };

  return (
    <UploadContext.Provider value={{ uploadState, updateUploadState, resetUploadState }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
};