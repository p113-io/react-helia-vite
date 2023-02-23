import React, { useState, useRef } from 'react';
import ipfsLogo from './assets/ipfs-logo.svg'
import { getHelia } from './getHelia.js'
import { unixfs } from '@helia/unixfs'
import { importFile }  from 'ipfs-unixfs-importer'

import './App.css'


const App = () => {
  const [output, setOutput] = useState([]);
  const [helia, setHelia] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

  const terminalEl = useRef(null);

  const COLORS = {
    active: '#357edd',
    success: '#0cb892',
    error: '#ea5037'
  }

  const showStatus = (text, color, id) => {
    setOutput((prev) => {
      return [...prev,
        {
        'content': text,
        'color': color,
        'id': id
        }
      ]
    })

    terminalEl.current.scroll({ top: terminal.scrollHeight, behavior: 'smooth' })
  };
  const store = async (name, content) => {
    let node = helia;

    if (!helia) {
      showStatus('Creating Helia node...', COLORS.active)

      node = await getHelia()

      setHelia(node)
    }

    const info = await node.info()
    showStatus(`Connecting to ${info.peerId}...`, COLORS.active, info.peerId)

    const encoder = new TextEncoder()

    const fileToAdd = {
      path: `${name}`,
      content: encoder.encode(content)
    }

    showStatus(`Adding file ${fileToAdd.path}...`, COLORS.active)
    const { cid } = await importFile(fileToAdd, node.blockstore)

    showStatus(`Added to ${cid}`, COLORS.success, cid)
    showStatus('Reading file...', COLORS.active)

    const fs = unixfs(node)
    const decoder = new TextDecoder()
    let text = ''

    for await (const chunk of fs.cat(cid)) {
      text += decoder.decode(chunk, {
        stream: true
      })
    }

    showStatus(`\u2514\u2500 ${name} ${text}`)
    showStatus(`Preview: https://ipfs.io/ipfs/${cid}`, COLORS.success)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (fileName == null || fileName.trim() === '') {
        throw new Error('File name is missing...')
      }

      if ((fileContent == null || fileContent.trim() === '')) {
        throw new Error('File content is missing...')
      }

      await store(fileName, fileContent)
    } catch (err) {
      showStatus(err.message, COLORS.error)
    }
  }

  return (
    <div className="App">
      <h1>Helia lib test</h1>
      <h1 className="pa0 f2 ma0 mb4 aqua tc">Add data to Helia from the browser</h1>

<form id="add-file" onSubmit={handleSubmit}>
  <label htmlFor="file-name" className="f5 ma0 pb2 aqua fw4 db">Name</label>
  <input
    className="input-reset bn black-80 bg-white pa3 w-100 mb3"
    id="file-name"
    name="file-name"
    type="text"
    placeholder="file.txt"
    required
    value={fileName} onChange={(e) => setFileName(e.target.value)}
  />

  <label htmlFor="file-content" className="f5 ma0 pb2 aqua fw4 db">Content</label>
  <input
    className="input-reset bn black-80 bg-white pa3 w-100 mb3 ft"
    id="file-content"
    name="file-content"
    type="text"
    placeholder="Hello world"
    required
    value={fileContent} onChange={(e) => setFileContent(e.target.value)}
  />

  <button
    className="button-reset pv3 tc bn bg-animate bg-black-80 hover-bg-aqua white pointer w-100"
    id="add-submit"
    type="submit"
  >
    Add file
  </button>
</form>

<h3>Output</h3>

<div className="window">
  <div className="header"></div>
  <div id="terminal" className="terminal" ref={terminalEl}>
    { output.length > 0 &&
      <div id="output">
        { output.map((log, index) =>
          <p key={index} style={{'color': log.color}} id={log.id}>
            {log.content}
          </p>)
        }
      </div>
    }
  </div>
</div>
    </div>
  )
}

export default App
