import React, { useEffect, useState } from 'react'
import getEnvironment from '../getenvironment';
import { cssReset, theme as T } from './config';

const apiUrl = getEnvironment();

const CSS = `
  ${cssReset}

  .ml-container{
    display:flex;
    flex-direction:column;
    gap:20px;
    animation:fadeIn .25s ease;
  }

  .tree-container{
    display: flex;
    justify-content: center;
  }

  .ml-card{
    background:${T.surface};
    border:1px solid ${T.border};
    border-radius:12px;
    overflow:hidden;
    margin: 20px;
    box-shadow:0 1px 6px rgba(26,31,60,.05);
  }

  .ml-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:18px 22px;
    border-bottom:1px solid ${T.border};
    background:${T.surfaceAlt};
  }

  .ml-title{
    font-size:18px;
    font-weight:700;
    color:${T.text};
  }

  .ml-size-badge{
    padding:5px 12px;
    border-radius:999px;
    background:${T.surface};
    border:1px solid ${T.border};
    color:${T.accent};
    font-size:12px;
    font-weight:700;
  }

  .folder-tree{
    padding:14px 0;
    width: 50%;
  }

  .file-panel{
    width: 50%;
  }
  
  .folder-node{
    margin-left:18px;
    border-left:1px dashed ${T.border};
  }

  .folder-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    padding:10px 16px;
    cursor:pointer;
    transition:.15s;
  }

  .folder-row:hover{
    background:${T.surfaceAlt};
  }

  .folder-left{
    display:flex;
    align-items:center;
    gap:10px;
    min-width:0;
  }

  .folder-arrow{
    width:18px;
    text-align:center;
    color:${T.textMuted};
    font-size:11px;
    flex-shrink:0;
  }

  .folder-icon{
    font-size:18px;
    flex-shrink:0;
  }

  .folder-name{
    font-size:14px;
    font-weight:600;
    color:${T.text};
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }

  .folder-size{
    color:${T.textMuted};
    font-size:13px;
    font-weight:600;
    white-space:nowrap;
  }

  .folder-children{
    padding-left:14px;
  }

  .folder-files{
    margin-left: 66px;
    font-size:14px;
    font-weight: 500;
    color:${T.text};
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }

  .empty-folder{
    padding:10px 48px;
    color:${T.textMuted};
    font-style:italic;
    font-size:13px;
  }

  @media(max-width:768px){
    .folder-row{
      padding:10px;
    }
    .tree-container{
      flex-direction: column;
    }
    .folder-name{
      font-size:13px;
    }
    .folder-tree{
        width: 100%;
    }
    .file-panel{
        width: 100%;
    }
  }
`;

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']);

const getFileExt = (filename) => filename.split('.').pop().toLowerCase();

const isImage = (filename) => IMAGE_EXTS.has(getFileExt(filename));

const ExtBadge = ({ filename }) => {
    const ext = getFileExt(filename);
    const colors = {
        pkl:  { bg: '#f3e8ff', color: '#7c3aed' },
        csv:  { bg: '#dcfce7', color: '#166534' },
        xlsx: { bg: '#dcfce7', color: '#166534' },
        xls:  { bg: '#dcfce7', color: '#166534' },
        json: { bg: '#dbeafe', color: '#1e40af' },
        mp4:  { bg: '#fee2e2', color: '#991b1b' },
        avi:  { bg: '#fee2e2', color: '#991b1b' },
        txt:  { bg: '#f1f5f9', color: '#475569' },
        npy:  { bg: '#fef3c7', color: '#92400e' },
        pt:   { bg: '#fce7f3', color: '#9d174d' },
        h5:   { bg: '#fce7f3', color: '#9d174d' },
    };
    const style = colors[ext] || { bg: '#f1f5f9', color: '#6b7280' };
    return (
        <div style={{
            width: 40, height: 24, borderRadius: 6, flexShrink: 0,
            background: style.bg, border: `1px solid ${style.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: style.color,
            textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
            {ext.slice(0, 4)}
        </div>
    );
};

export const MLDataFolder = () => {
    const [mlFolderTree, setMlFolderTree] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderFiles, setFolderFiles] = useState({});
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedFolders, setExpandedFolders] = useState(new Set([""]));

    const [previewFile, setPreviewFile] = useState(null);

    const formatBytes = (bytes) => {
        if (!bytes) return "0 B";

        const units = ["B","KB","MB","GB","TB"];
        const i = Math.floor(Math.log(bytes)/Math.log(1024));

        return `${(bytes/Math.pow(1024,i)).toFixed(2)} ${units[i]}`;
    };
    
    const getFolderFiles = async (folder, page = 1) => {
        if (
            folderFiles[folder] &&
            folderFiles[folder].pages &&
            folderFiles[folder].pages[page]
        ) {
            return;
        }
        setLoadingFiles(true);
        try {
            const res = await fetch(
                `${apiUrl}/attendancemodule/mldatafoldertree/files?folder=${encodeURIComponent(folder)}&page=${page}&limit=50`
            );
            const data = await res.json();
            setFolderFiles(prev => ({
                ...prev,
                [folder]: {
                    totalFiles: data.totalFiles,
                    hasMore: data.hasMore,
                    pages: {
                        ...(prev[folder]?.pages || {}),
                        [page]: data.files,
                    },
                },
            }));
        } finally {
            setLoadingFiles(false);
        }
    };

    const FolderNode = ({folder}) => {
        const open = expandedFolders.has(folder.relativePath);
        const hasChildren = folder.subfolders?.length > 0;
        const toggleFolder = (path) => {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                return next;
            });
        };

        return (
            <div className="folder-node">
                <div className="folder-row"  style={{background: selectedFolder === folder.relativePath && T.border}} onClick={() => {
                    if (hasChildren) {
                        toggleFolder(folder.relativePath);
                    }
                    setSelectedFolder(folder.relativePath);
                    getFolderFiles(folder.relativePath, 1);
                }}>
                    <div className="folder-left">
                        <span className="folder-arrow">
                            {hasChildren ? (open ? "▼" : "▶") : ""}
                        </span>
                        <span className="folder-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder">
                                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                            </svg>
                        </span>
                        <span className="folder-name">
                            {folder.name}
                        </span>
                    </div>
                    <span className="folder-size">
                        {formatBytes(folder.size)}
                    </span>
                </div>
                {
                    open && (
                        <div className="folder-children">
                            {
                                hasChildren && folder.subfolders.map(sub => (
                                        <FolderNode
                                            key={sub.relativePath}
                                            folder={sub}
                                        />
                                    ))
                            }
                        </div>
                    
                    )
                }
            </div>
        );
    };

    const pageSize = 50;
    const totalFiles = folderFiles[selectedFolder]?.totalFiles || 0;
    const start = totalFiles === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalFiles);
    
    const getMLFolderTree = async () => {
        try{
            const url = `${apiUrl}/attendancemodule/mldatafoldertree`
            const res = await fetch(url);
            const data = await res.json();
            setMlFolderTree(data);
        }
        catch(e){
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(()=> {
        getMLFolderTree();
    }, [])
    if(loading){
        return (
            <div style={{color: T.textMuted, display: "flex", justifyContent: "center", alignItems : "center", position: "relative", top: "40%"}}>Loading...</div>
        )
    }
    return (
        <>
            <style>{CSS}</style>
            <div className="ml-container">
                <div className="ml-card">
                    <div className="ml-header">
                        <div className="ml-title">
                            ML Data Storage
                        </div>
                        <div className="ml-size-badge">
                            {formatBytes(mlFolderTree.size)}
                        </div>
                    </div>
                  <div className='tree-container'>
                    <div className="folder-tree" style={{borderRight: `1px solid ${T.border}`}}>
                        <FolderNode folder={mlFolderTree}/>
                    </div>
                    <div className='file-panel'>
                        {selectedFolder === null ? (
                        <div
                            style={{
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: T.textMuted,
                                fontSize: "15px",
                            }}
                        >
                            Select a folder to view its files.
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    padding: "18px 20px",
                                    borderBottom: `1px solid ${T.border}`,
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span>{selectedFolder.length > 30 ? selectedFolder.slice(0, 30) + "..." : selectedFolder || "ml-data"}</span>

                                <div style={{display: "flex", gap: "8px",justifyContent: "center",alignItems:"center", color: T.textMuted, fontWeight: 500, fontSize: "13px"}}>
                                    <span>
                                        {start}-{end} / {totalFiles} Files
                                    </span>
                                    <span>|</span>
                                    <span style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                            <button
                                        onClick={() => {
                                            setCurrentPage(prev => {
                                                if (prev === 1) return prev;
                                                const page = prev - 1;
                                                getFolderFiles(selectedFolder, page);
                                                return page;
                                            });
                                        }}
                                        style={{color: T.accent}}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                                        </button>
                                    
                                        Page <span style={{fontWeight: "700", color: T.accent, marginLeft: "4px"}}>{currentPage}</span>
                                        <button
                                        onClick={() => {
                                            setCurrentPage(prev => {
                                                const nextPage = prev + 1;
                                                const hasCachedPage =
                                                    folderFiles[selectedFolder]?.pages?.[nextPage];
                                                const canGoNext =
                                                    hasCachedPage || folderFiles[selectedFolder]?.hasMore;
                                                if (canGoNext) {
                                                    getFolderFiles(selectedFolder, nextPage);
                                                    return nextPage;
                                                }
                                                return prev;
                                            });
                                        }}
                                        style={{color: T.accent}}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                                        </button>
                                    </span>
                                </div>
                            </div>

                            {loadingFiles ? (
                                <div
                                    style={{
                                        padding: 40,
                                        textAlign: "center",
                                        color: T.textMuted,
                                    }}
                                >
                                    Loading files...
                                </div>
                            ) : (
                                <>
                                    {(folderFiles[selectedFolder]?.pages?.[currentPage] || []).length === 0 ? (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: "center",
                                                color: T.textMuted,
                                            }}
                                        >
                                            This folder contains no files.
                                        </div>
                                    ) : (
                                        <div style={{maxHeight: "66vh", overflow: "scroll"}}>
                                            {(folderFiles[selectedFolder]?.pages?.[currentPage] || []).map(file => (
                                                <div
                                                    key={file.relativePath}
                                                    onClick={() => setPreviewFile(file)}
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr 120px 170px",
                                                        padding: "12px 20px",
                                                        borderBottom: `1px solid ${T.border}`,
                                                        cursor: "pointer",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {isImage(file.filename) ? (
                                                        <img
                                                            src={`${apiUrl}/attendancemodule/mldatafoldertree/file?path=${encodeURIComponent(file.relativePath)}`}
                                                            alt={file.filename}
                                                            style={{
                                                                width: "40px",
                                                                height: "24px",
                                                                objectFit: "cover",
                                                                borderRadius: "6px",
                                                                border: `1px solid ${T.border}`,
                                                                flexShrink: 0,
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <ExtBadge filename={file.filename} />
                                                    )}

                                                    <span
                                                        style={{
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {file.filename}
                                                    </span>
                                                </div>

                                                    <div
                                                        style={{
                                                            color: T.textMuted,
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {formatBytes(file.size)}
                                                    </div>

                                                    <div
                                                        style={{
                                                            color: T.textMuted,
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {new Date(file.modified).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {previewFile && (() => {
                                const currentFiles = folderFiles[selectedFolder]?.pages?.[currentPage] || [];
                                const previewIdx = currentFiles.findIndex(f => f.relativePath === previewFile.relativePath);
                                const canPrev = previewIdx > 0;
                                const canNext = previewIdx < currentFiles.length - 1;
                                const navBtn = (enabled, onClick, children) => (
                                    <button
                                        onClick={onClick}
                                        disabled={!enabled}
                                        style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                                            border: 'none', cursor: enabled ? 'pointer' : 'default',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, color: enabled ? '#374151' : 'rgba(0,0,0,0.2)',
                                            flexShrink: 0,
                                        }}
                                    >{children}</button>
                                );
                                return (
                                    <div
                                        onClick={() => setPreviewFile(null)}
                                        style={{
                                            position: "fixed", inset: 0,
                                            background: "rgba(0,0,0,.82)",
                                            display: "flex", justifyContent: "center",
                                            alignItems: "center", zIndex: 10000, gap: 16,
                                        }}
                                    >
                                        {navBtn(canPrev, (e) => { e.stopPropagation(); setPreviewFile(currentFiles[previewIdx - 1]); }, '‹')}

                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                background: "#fff", padding: 20,
                                                borderRadius: 12, maxWidth: "80vw", maxHeight: "90vh",
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                                                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                                    {previewIdx + 1} / {currentFiles.length}
                                                </span>
                                                <button
                                                    onClick={() => setPreviewFile(null)}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        fontSize: 18, color: '#6b7280', lineHeight: 1,
                                                    }}
                                                >✕</button>
                                            </div>

                                            {isImage(previewFile.filename) ? (
                                                <img
                                                    src={`${apiUrl}/attendancemodule/mldatafoldertree/file?path=${encodeURIComponent(previewFile.relativePath)}`}
                                                    alt={previewFile.filename}
                                                    style={{ maxWidth: "75vw", maxHeight: "75vh", display: "block", borderRadius: 8 }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 200, height: 160, display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', gap: 12,
                                                    background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
                                                }}>
                                                    <ExtBadge filename={previewFile.filename} />
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Preview not available</span>
                                                </div>
                                            )}

                                            <div style={{ marginTop: 12, textAlign: "center", fontWeight: 600, fontSize: 13, color: '#374151', maxWidth: '75vw', wordBreak: 'break-all' }}>
                                                {previewFile.filename}
                                            </div>
                                        </div>

                                        {navBtn(canNext, (e) => { e.stopPropagation(); setPreviewFile(currentFiles[previewIdx + 1]); }, '›')}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                    </div>
                  </div>
                </div>
            </div>
        </>
    );
}
