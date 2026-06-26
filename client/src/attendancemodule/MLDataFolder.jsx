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

    .folder-name{
      font-size:13px;
    }
  }
`;

export const MLDataFolder = () => {
    const [mlFolderTree, setMlFolderTree] = useState({});
    const [loading, setLoading] = useState(true);

    const formatBytes = (bytes) => {
        if (!bytes) return "0 B";

        const units = ["B","KB","MB","GB","TB"];
        const i = Math.floor(Math.log(bytes)/Math.log(1024));

        return `${(bytes/Math.pow(1024,i)).toFixed(2)} ${units[i]}`;
    };

    const FolderNode = ({folder}) => {
        const [open,setOpen] = React.useState(folder.name === "ml-data");

        const hasChildren = folder.subfolders?.length > 0 || folder.files > 0;

        return (
            <div className="folder-node">
                <div className="folder-row" onClick={() => hasChildren && setOpen(!open)}>
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
                                            key={sub.name}
                                            folder={sub}
                                        />
                                    ))
                            }
                            {folder.files > 0 && (
                                <div className="folder-files" style={{display: "flex", gap: "10px", marginTop: "6px"}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text">
                                        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                                            <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                                            <path d="M10 9H8"/><path d="M16 13H8"/>
                                        <path d="M16 17H8"/>
                                    </svg>
                                    {folder.files} {folder.files === 1 ? "File" : "Files"}
                                </div>
                            )}
                        </div>
                    
                    )
                }
            </div>
        );
    };
    
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
                    <div className="folder-tree">
                        <FolderNode folder={mlFolderTree}/>
                    </div>
                </div>
            </div>
        </>
    );
}
