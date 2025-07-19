'use client';

import { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch API specification');
        }
        return res.json();
      })
      .then(data => {
        setSpec(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">API dokümantasyonu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Hata</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Air Inventory API</h1>
                  <p className="text-sm text-gray-600">Dokümantasyon ve Test Arayüzü</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Ana Sayfa
              </a>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>v1.0.0</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>OpenAPI 3.0</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-blue-100 mb-2">Toplam Endpoint</h3>
                <p className="text-2xl font-bold">20+</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-100 mb-2">Desteklenen Formatlar</h3>
                <p className="text-2xl font-bold">JSON</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-100 mb-2">Güvenlik</h3>
                <p className="text-2xl font-bold">JWT + API Key</p>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Başlangıç</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Base URL</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800 font-mono">
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api
                </code>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Authentication</h3>
                <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800 font-mono">
                  Authorization: Bearer &lt;token&gt;
                </code>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Özellikler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Fatura Yönetimi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Malzeme Takibi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Reçete Analizi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Cari Hesap</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sayfalama</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Filtreleme</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sıralama</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Real-time Testing</span>
              </div>
            </div>
          </div>

          {/* Swagger UI */}
          <div className="swagger-ui-container">
            {spec && (
              <SwaggerUI 
                spec={spec}
              docExpansion="none"
              defaultModelsExpandDepth={2}
              defaultModelExpandDepth={2}
              displayOperationId={false}
              displayRequestDuration={true}
              filter={true}
              showExtensions={true}
              showCommonExtensions={true}
              tryItOutEnabled={true}
              requestInterceptor={(request) => {
                // Fix the URL to remove duplicate /api
                if (request.url.includes('/api/api/')) {
                  request.url = request.url.replace('/api/api/', '/api/');
                }
                return request;
              }}
              responseInterceptor={(response) => {
                // Handle response
                return response;
              }}
              onComplete={() => {
                console.log('Swagger UI loaded successfully');
              }}
              plugins={[]}
              supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Air Inventory API Documentation - v1.0.0
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://swagger.io/specification/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                OpenAPI 3.0 Specification
              </a>
              <a 
                href="https://github.com/swagger-api/swagger-ui" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Swagger UI
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style jsx global>{`
        .swagger-ui-container {
          min-height: 800px;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .info .title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .swagger-ui .info .description {
          margin: 10px 0;
          color: #6b7280;
        }
        
        .swagger-ui .scheme-container {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        
        .swagger-ui .opblock {
          border-radius: 8px;
          margin: 10px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: #3b82f6;
        }
        
        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
        }
        
        .swagger-ui .opblock .opblock-summary {
          padding: 15px;
        }
        
        .swagger-ui .btn.try-out__btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .swagger-ui .btn.try-out__btn:hover {
          background: #2563eb;
        }
        
        .swagger-ui .btn.execute {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .swagger-ui .btn.execute:hover {
          background: #059669;
        }
        
        .swagger-ui .parameters-container {
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
        }
        
        .swagger-ui .responses-wrapper {
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
        }
        
        .swagger-ui .response-col_status {
          font-weight: bold;
        }
        
        .swagger-ui .response-col_description {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}