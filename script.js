class BingoMaker {
    constructor() {
        this.gridSize = 5;
        this.centerIndex = 12; // Center cell in a 5x5 grid (0-indexed)
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
    }

    createGrid() {
        const grid = document.getElementById('bingoGrid');
        grid.innerHTML = '';

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('textarea');
            cell.className = 'bingo-cell';
            cell.setAttribute('maxlength', '100');
            cell.setAttribute('placeholder', 'Entrez votre texte...');

            // Make center cell the free space with logo
            if (i === this.centerIndex) {
                cell.className += ' free-space';
                cell.value = '';
                cell.setAttribute('readonly', true);
                cell.setAttribute('placeholder', '');
            }

            // Auto-resize textarea
            cell.addEventListener('input', this.autoResize);
            
            grid.appendChild(cell);
        }
    }

    autoResize(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(80, textarea.scrollHeight) + 'px';
    }

    setupEventListeners() {
        const clearBtn = document.getElementById('clearBtn');
        const exportBtn = document.getElementById('exportBtn');
        const dateInput = document.getElementById('dateInput');

        clearBtn.addEventListener('click', () => this.clearGrid());
        exportBtn.addEventListener('click', () => this.exportAsImage());
        
        // Date input formatting
        dateInput.addEventListener('input', this.formatDateInput.bind(this));
    }

    formatDateInput(event) {
        let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Limit to 8 digits (DDMMYYYY)
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        // Add slashes automatically
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length >= 5) {
            value = value.substring(0, 5) + '/' + value.substring(5);
        }
        
        event.target.value = value;
    }

    clearGrid() {
        const cells = document.querySelectorAll('.bingo-cell:not(.free-space)');
        cells.forEach(cell => {
            cell.value = '';
            cell.style.height = '100px';
        });
        
        // Clear header inputs
        document.getElementById('pseudoInput').value = '';
        document.getElementById('dateInput').value = '';
    }

    async exportAsImage() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) {
            alert('Erreur: Canvas non trouvé');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Get header info
        const pseudo = document.getElementById('pseudoInput').value || '';
        const date = document.getElementById('dateInput').value || '';
        
        // Set canvas size for high quality export (add space for header if needed)
        const scale = 2; // 2x resolution for crisp quality
        const cellSize = 200; // Larger cells for better quality
        const gridSize = this.gridSize;
        const borderWidth = 8;
        const padding = 60; // Generous padding around the entire image
        const headerHeight = (pseudo || date) ? 120 : 0;
        const gridWidth = gridSize * cellSize + (gridSize + 1) * borderWidth;
        const gridHeight = gridSize * cellSize + (gridSize + 1) * borderWidth;
        const canvasSize = gridWidth + (padding * 2);
        const totalHeight = gridHeight + headerHeight + (padding * 2);
        
        canvas.width = canvasSize * scale;
        canvas.height = totalHeight * scale;
        
        // Scale the context for high DPI
        ctx.scale(scale, scale);

        // Fill background with community color
        ctx.fillStyle = '#4D8196';
        ctx.fillRect(0, 0, canvasSize, totalHeight);
        
        // Add dotted pattern to match web interface
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const dotSpacing = 20;
        const dotRadius = 1;
        
        for (let x = dotSpacing; x < canvasSize; x += dotSpacing) {
            for (let y = dotSpacing; y < totalHeight; y += dotSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Draw header info if present
        if (pseudo || date) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Nunito, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (pseudo && date) {
                ctx.fillText(`${pseudo} - ${date}`, canvasSize / 2, padding + 40);
            } else if (pseudo) {
                ctx.fillText(pseudo, canvasSize / 2, padding + 40);
            } else if (date) {
                ctx.fillText(date, canvasSize / 2, padding + 40);
            }
        }

        // Load logo for export (works on GitHub Pages)
        const logo = new Image();
        let logoLoaded = false;
        
        try {
            await new Promise((resolve, reject) => {
                logo.onload = () => {
                    logoLoaded = true;
                    resolve();
                };
                logo.onerror = () => {
                    logoLoaded = false;
                    resolve();
                };
                logo.src = './assets/Fichier_972x.png';
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    if (!logoLoaded) {
                        resolve();
                    }
                }, 5000);
            });
        } catch (error) {
            logoLoaded = false;
        }

        // Draw grid
        const cells = document.querySelectorAll('.bingo-cell');
        
        for (let i = 0; i < cells.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = col * cellSize + (col + 1) * borderWidth + padding;
            const y = row * cellSize + (row + 1) * borderWidth + headerHeight + padding;

            // Draw cell background
            if (i === this.centerIndex) {
                ctx.fillStyle = '#AD553D'; // Community brown/red for free space
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(x, y, cellSize, cellSize);

            // Draw cell border
            ctx.strokeStyle = '#AD553D';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, cellSize, cellSize);

            // Draw center cell content
            if (i === this.centerIndex) {
                // Draw logo if loaded, otherwise text fallback
                if (logoLoaded && logo.complete) {
                    const logoSize = cellSize * 0.75;
                    const logoX = x + (cellSize - logoSize) / 2;
                    const logoY = y + (cellSize - logoSize) / 2;
                    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                } else {
                    // Fallback text for local development or if logo fails
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 28px Nunito, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★ LOGO ★', x + cellSize / 2, y + cellSize / 2);
                }
            } else {
                // Draw text for regular cells
                const text = cells[i].value || '';
                if (text) {
                    ctx.fillStyle = '#333333';
                    ctx.font = 'bold 22px Nunito, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Word wrap for long text
                    const words = text.split(' ');
                    const lines = [];
                    let currentLine = '';
                    const maxWidth = cellSize - 30;

                    for (const word of words) {
                        const testLine = currentLine + (currentLine ? ' ' : '') + word;
                        const metrics = ctx.measureText(testLine);
                        
                        if (metrics.width > maxWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    if (currentLine) {
                        lines.push(currentLine);
                    }

                    // Draw lines
                    const lineHeight = 28;
                    const startY = y + cellSize / 2 - (lines.length - 1) * lineHeight / 2;
                    
                    lines.forEach((line, index) => {
                        ctx.fillText(line, x + cellSize / 2, startY + index * lineHeight);
                    });
                }
            }
        }

        // Download the canvas
        this.downloadCanvas(canvas);
    }
    
    downloadCanvas(canvas) {
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bingo-card-${new Date().toISOString().slice(0, 10)}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.95);
    }
}

// Initialize the bingo maker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BingoMaker();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        document.getElementById('exportBtn').click();
    }
    
    // Ctrl/Cmd + R to clear (prevent page refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        document.getElementById('clearBtn').click();
    }
});
