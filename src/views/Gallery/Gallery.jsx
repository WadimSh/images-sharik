import { useState, useRef } from 'react';

export const Gallery = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const token = process.env.REACT_APP_YANDEX_APP_API_KEY;

  // Получение списка папок
  const fetchFolders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL('https://cloud-api.yandex.net/v1/disk/resources');
      url.searchParams.append('path', 'disk:/');
      url.searchParams.append('limit', '100');
      url.searchParams.append('fields', '_embedded.items.name,_embedded.items.path,_embedded.items.type');

      const response = await fetch(url, {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.description || data.message || 'Ошибка при получении данных');
      }

      // Фильтруем только папки
      const folderItems = data._embedded.items.filter(item => item.type === 'dir');
      setFolders(folderItems);
      
    } catch (error) {
      console.error('Ошибка при получении папок:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Получение файлов в выбранной папке
  const fetchFiles = async () => {
    if (!selectedFolder) return;
    
    setIsLoading(true);
    setError(null);
    setFiles([]);
    setDownloadUrl(null);
    
    try {
      // Используем URLSearchParams для автоматического кодирования
      const url = new URL('https://cloud-api.yandex.net/v1/disk/resources');
      url.searchParams.append('path', selectedFolder); // Путь в исходном формате
      url.searchParams.append('limit', '100');
      url.searchParams.append('fields', '_embedded.items.name,_embedded.items.path,_embedded.items.preview,_embedded.items.mime_type');
  
      const response = await fetch(url, {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.description || data.message || 'Ошибка при получении файлов');
      }
  
      // Фильтруем элементы, считая файлами все, у которых есть mime_type
      const fileItems = data._embedded.items
        .filter(item => item.mime_type)
        .map(file => ({
          ...file,
          isImage: file.mime_type && file.mime_type.startsWith('image/')
        }));
      
      setFiles(fileItems);
      
    } catch (error) {
      console.error('Ошибка при получении файлов:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Получение ссылки на скачивание файла
  const fetchDownloadUrl = async (filePath) => {
    setError(null);
    setDownloadUrl(null);
    
    try {
      const url = new URL('https://cloud-api.yandex.net/v1/disk/resources/download');
      url.searchParams.append('path', filePath);

      const response = await fetch(url, {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.description || data.message || 'Ошибка при получении ссылки');
      }

      setDownloadUrl(data.href);
      
    } catch (error) {
      console.error('Ошибка при получении ссылки:', error);
      setError(error.message);
    }
  };

  // Обработчик изменения выбранной папки
  const handleFolderChange = (e) => {
    setSelectedFolder(e.target.value);
    setFiles([]);
    setDownloadUrl(null);
    setUploadStatus(null);
  };

  // Обработчик выбора файла для загрузки
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  // Загрузка файла на Яндекс.Диск
  const uploadFileToYandexDisk = async () => {
    if (!selectedFile || !selectedFolder) {
      setError('Выберите файл и папку для загрузки');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Получаем URL для загрузки
      const fileName = selectedFile.name;
      const filePath = `${selectedFolder}/${fileName}`;
            
      const url = new URL('https://cloud-api.yandex.net/v1/disk/resources/upload');
      url.searchParams.append('path', filePath);
      url.searchParams.append('overwrite', 'true');

      const response = await fetch(url, {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.description || data.message || 'Ошибка при получении URL для загрузки');
      }

      // 2. Загружаем файл по полученному URL
      const uploadResponse = await fetch(data.href, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка при загрузке файла');
      }

      setUploadStatus('success');
      setSelectedFile(null);
      
      // Очищаем input файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Обновляем список файлов
      fetchFiles();
      
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      setError(error.message);
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  console.log(files);
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Галерея Яндекс.Диска</h1>
      
      {/* Блок управления папками */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={fetchFolders}
            disabled={isLoading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            {isLoading ? 'Загрузка...' : 'Получить список папок'}
          </button>
          
          {folders.length > 0 && (
            <div style={{ flexGrow: 1 }}>
              <label htmlFor="folder-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
                Выберите папку: 
              </label>
              <select 
                id="folder-select"
                value={selectedFolder}
                onChange={handleFolderChange}
                style={{
                  padding: '8px',
                  width: '50%',
                  minWidth: '300px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">-- Выберите папку --</option>
                {folders.map(folder => (
                  <option key={folder.path} value={folder.path}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Блок загрузки файлов */}
        {selectedFolder && (
          <div style={{ 
            backgroundColor: '#e8f4f8', 
            padding: '15px', 
            borderRadius: '6px',
            marginTop: '15px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Загрузить файл в папку</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Выбрать файл
              </button>
              
              {selectedFile && (
                <div style={{ flexGrow: 1 }}>
                  <span style={{ marginRight: '10px' }}>Выбран: {selectedFile.name}</span>
                  <span>({Math.round(selectedFile.size / 1024)} KB)</span>
                </div>
              )}
              
              <button
                onClick={uploadFileToYandexDisk}
                disabled={!selectedFile || isLoading}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                {isLoading ? 'Загрузка...' : 'Загрузить на Диск'}
              </button>
            </div>
            
            {uploadStatus === 'success' && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px'
              }}>
                Файл успешно загружен!
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px'
              }}>
                Ошибка при загрузке файла
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Кнопка показа файлов */}
      {selectedFolder && folders.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button 
            onClick={fetchFiles}
            disabled={isLoading}
            style={{
              padding: '10px 25px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {files.length ? 'Обновить список файлов' : 'Показать файлы в папке'}
          </button>
        </div>
      )}
      
      {/* Отображение ошибок */}
      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          borderRadius: '5px',
          color: '#c62828'
        }}>
          <h3>Ошибка:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      {/* Сетка файлов */}
      {files.length > 0 && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
            Файлы в папке: {
              folders.find(f => f.path === selectedFolder)?.name || selectedFolder
            }
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '25px',
            marginTop: '20px'
          }}>
            {files.map(file => (
              <div 
                key={file.path} 
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                  }
                }}
                onClick={() => fetchDownloadUrl(file.path)}
              >
                {file.isImage && file.preview ? (
                  <img 
                    src={`https://images.weserv.nl/?url=${encodeURIComponent(file.preview)}&w=500`} 
                    alt={file.name} 
                    style={{ 
                      width: '100%', 
                      height: '180px', 
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: '1px solid #eee',
                    fontSize: '60px',
                    color: '#607d8b'
                  }}>
                    {file.mime_type?.includes('pdf') ? '📄' : '📁'}
                  </div>
                )}
                <div style={{ 
                  marginTop: '12px', 
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Ссылка на скачивание */}
      {downloadUrl && (
        <div style={{ 
          marginTop: '40px', 
          padding: '25px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>Ссылка для скачивания:</h3>
          <a 
            href={downloadUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 25px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginTop: '15px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Скачать файл
          </a>
          <div style={{ 
            marginTop: '20px', 
            wordBreak: 'break-all',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Прямая ссылка:</div> 
            {downloadUrl}
          </div>
        </div>
      )}
    </div>
  );
}; 