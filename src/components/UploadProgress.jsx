import { useUpload } from '../contexts/UploadContext';

const UploadProgress = () => {
  const { uploadState, updateUploadState } = useUpload();
  const { 
    isUploading, 
    uploadProgress, 
    uploadResults, 
    currentFileIndex, 
    totalFilesCount 
  } = uploadState;

  const cancelUpload = () => {
    if (uploadState.uploadController) {
      uploadState.uploadController.abort();
    }
    updateUploadState({ isUploading: false });
    alert('Загрузка отменена');
  };

  const clearResults = () => {
    updateUploadState({ 
      uploadResults: [],
      uploadProgress: {}
    });
  };

  if (!isUploading && uploadResults.length === 0) {
    return null;
  }

  const files = Object.keys(uploadProgress);
  const progressPercentage = totalFilesCount > 0 
    ? Math.round((currentFileIndex / totalFilesCount) * 100) 
    : 0;
  const successCount = uploadResults.filter(r => r.status === 'success').length;
  const failedCount = uploadResults.filter(r => r.status === 'failed').length;

  return (
    <div className="upload-progress-wrapper" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      maxWidth: '90vw',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Прогресс-панель */}
      {isUploading && (
        <div style={{
          background: 'white',
          padding: '15px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '500', color: '#333' }}>
              Загрузка файлов...
            </div>
            <button
              onClick={cancelUpload}
              style={{
                padding: '4px 12px',
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Отменить
            </button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            fontSize: '14px',
            color: '#555'
          }}>
            <span>Файл {currentFileIndex} из {totalFilesCount}</span>
            <span>{progressPercentage}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Текущий файл */}
          {files.length > 0 && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid #4caf50',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {files[files.length - 1]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Результаты загрузки */}
      {uploadResults.length > 0 && !isUploading && (
        <div style={{
          background: 'white',
          padding: '15px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '500', color: '#333' }}>
              📊 Результаты загрузки
            </div>
            <button
              onClick={clearResults}
              style={{
                padding: '4px 12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Закрыть
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '15px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '8px',
              background: '#e8f5e8',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
                {successCount}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>Успешно</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '8px',
              background: '#ffebee',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>
                {failedCount}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>Ошибки</div>
            </div>
          </div>

          <details>
            <summary style={{ 
              cursor: 'pointer', 
              color: '#2196f3',
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Детали ({uploadResults.length} файлов)
            </summary>
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              marginTop: '10px',
              padding: '10px',
              background: '#f9f9f9',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '12px'
            }}>
              {uploadResults.slice(0, 5).map((result, index) => (
                <div key={index} style={{
                  padding: '6px',
                  marginBottom: '6px',
                  borderLeft: `3px solid ${result.status === 'success' ? '#4caf50' : '#f44336'}`,
                  backgroundColor: result.status === 'success' ? '#f1f8e9' : '#ffebee'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>{result.file}</span>
                    <span style={{
                      fontSize: '11px',
                      background: result.status === 'success' ? '#4caf50' : '#f44336',
                      color: 'white',
                      padding: '1px 4px',
                      borderRadius: '4px'
                    }}>
                      {result.status === 'success' ? '✅' : '❌'}
                    </span>
                  </div>
                  {result.status === 'failed' && (
                    <div style={{ color: '#d32f2f', marginTop: '2px', fontSize: '11px' }}>
                      {result.error}
                    </div>
                  )}
                </div>
              ))}
              {uploadResults.length > 5 && (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '11px', padding: '5px' }}>
                  ... и еще {uploadResults.length - 5} файлов
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadProgress;