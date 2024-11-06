import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PodContentModal = ({ onClose, podUrls }) => {
  const [podContents, setPodContents] = useState([]);

  useEffect(() => {
    const fetchAllPodContents = async () => {
      try {
        const contents = await Promise.all(
          podUrls.map(async (podUrl) => {
            const response = await axios.get(podUrl, {
              headers: { Accept: 'text/turtle' },
            });
            const files = parsePodContent(response.data);
            return { url: podUrl, files };
          })
        );
        setPodContents(contents);
      } catch (error) {
        console.error("Error fetching pod content:", error);
      }
    };

    fetchAllPodContents();
  }, [podUrls]);

  const parsePodContent = (data) => {
    const files = [];
    
    const containsRegex = /ldp:contains\s+((<[^>]+>,?\s*)+)/;
    const containsMatch = data.match(containsRegex);
  
    if (containsMatch) {
      const itemMatches = containsMatch[1].match(/<([^>]+)>/g);
      
      itemMatches.forEach((item) => {
        const itemPath = item.replace(/[<>]/g, '');
  
        const metadataRegex = new RegExp(`<${itemPath}>[^;]*dc:modified\\s+"([^"]+)"[^;]*;.*?posix:size\\s+(\\d+)`, 's');
        const fileMatch = metadataRegex.exec(data);
  
        if (fileMatch) {
          files.push({
            path: itemPath,
            modified: new Date(fileMatch[1]).toLocaleString(),
            size: fileMatch[2],
          });
        } else {
          files.push({
            path: itemPath,
            modified: "Unknown",
            size: "Unknown",
          });
        }
      });
    }
    
    return files;
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Pod Content</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {podContents.map((pod, index) => (
              <div key={index} className="mb-4">
                <h6>{`Content of ${pod.url}`}</h6>
                {pod.files.length > 0 ? (
                  <ul className="list-group">
                    {pod.files.map((file, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{file.path}</span>
                        <span className="text-muted">
                          Last Modified: {file.modified} - Size: {file.size} bytes
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No files available in this pod.</p>
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodContentModal;
