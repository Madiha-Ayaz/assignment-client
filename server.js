const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch (error) {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('Created data directory');
    }
}

// API Routes

// Save file
app.post('/api/files/save', async (req, res) => {
    try {
        const { filename, content } = req.body;
        
        if (!filename || content === undefined) {
            return res.status(400).json({ 
                error: 'Filename and content are required' 
            });
        }

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, sanitizedFilename);
        
        await fs.writeFile(filePath, content, 'utf8');
        
        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            message: `File "${sanitizedFilename}" saved successfully`,
            filename: sanitizedFilename,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
        });
        
        console.log(`File saved: ${sanitizedFilename}`);
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ 
            error: 'Failed to save file',
            details: error.message 
        });
    }
});

// Load file
app.get('/api/files/load/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Sanitize filename
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, sanitizedFilename);
        
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            filename: sanitizedFilename,
            content: content,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
        });
        
        console.log(`File loaded: ${sanitizedFilename}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ 
                error: 'File not found',
                filename: req.params.filename 
            });
        } else {
            console.error('Error loading file:', error);
            res.status(500).json({ 
                error: 'Failed to load file',
                details: error.message 
            });
        }
    }
});

// Update file
app.put('/api/files/update', async (req, res) => {
    try {
        const { filename, content } = req.body;
        
        if (!filename || content === undefined) {
            return res.status(400).json({ 
                error: 'Filename and content are required' 
            });
        }

        // Sanitize filename
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, sanitizedFilename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ 
                error: 'File not found',
                filename: sanitizedFilename 
            });
        }
        
        await fs.writeFile(filePath, content, 'utf8');
        
        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            message: `File "${sanitizedFilename}" updated successfully`,
            filename: sanitizedFilename,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
        });
        
        console.log(`File updated: ${sanitizedFilename}`);
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ 
            error: 'Failed to update file',
            details: error.message 
        });
    }
});

// List files
app.get('/api/files/list', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const fileList = [];
        
        for (const filename of files) {
            const filePath = path.join(DATA_DIR, filename);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
                fileList.push({
                    filename: filename,
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString()
                });
            }
        }
        
        // Sort by last modified (newest first)
        fileList.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        res.json({
            success: true,
            files: fileList,
            count: fileList.length
        });
        
        console.log(`Listed ${fileList.length} files`);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ 
            error: 'Failed to list files',
            details: error.message 
        });
    }
});

// Delete file
app.delete('/api/files/delete/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Sanitize filename
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, sanitizedFilename);
        
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: `File "${sanitizedFilename}" deleted successfully`,
            filename: sanitizedFilename
        });
        
        console.log(`File deleted: ${sanitizedFilename}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ 
                error: 'File not found',
                filename: req.params.filename 
            });
        } else {
            console.error('Error deleting file:', error);
            res.status(500).json({ 
                error: 'Failed to delete file',
                details: error.message 
            });
        }
    }
});

// Get file info
app.get('/api/files/info/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Sanitize filename
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, sanitizedFilename);
        
        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            filename: sanitizedFilename,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        });
        
        console.log(`File info retrieved: ${sanitizedFilename}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ 
                error: 'File not found',
                filename: req.params.filename 
            });
        } else {
            console.error('Error getting file info:', error);
            res.status(500).json({ 
                error: 'Failed to get file info',
                details: error.message 
            });
        }
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.originalUrl 
    });
});

// Start server
async function startServer() {
    try {
        await ensureDataDir();
        
        app.listen(PORT, () => {
            console.log('🚀 Word Processor Server Started');
            console.log(`📝 Server running on http://localhost:${PORT}`);
            console.log(`📁 Data directory: ${DATA_DIR}`);
            console.log('🔥 Ready to process your documents!');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();