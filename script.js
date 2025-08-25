class BingoMaker {
    constructor() {
        this.gridSize = 5;
        this.centerIndex = Math.floor(this.gridSize * this.gridSize / 2);
        this.uploadedImages = [];
        this.cellImages = {}; // Store images for each cell
        this.centerImage = null;
        
        // Default dark theme colors
        this.currentTheme = {
            bgColor: '#1a1a1a',
            gridColor: '#333333',
            cellColor: '#2a2a2a',
            freeSpaceColor: '#444444',
            textColor: '#e0e0e0'
        };
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.setupSidebar();
        this.setupDragAndDrop();
        this.loadSavedSessions();
        this.applyTheme();
        this.updateCenterCell(); // Ensure center cell shows correct default state
    }

    createGrid() {
        const grid = document.getElementById('bingoGrid');
        grid.innerHTML = '';

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('textarea');
            cell.className = 'bingo-cell';
            cell.setAttribute('maxlength', '100');
            cell.setAttribute('placeholder', 'Add text or image');
            cell.dataset.cellIndex = i;

            // Make center cell the free space with text
            if (i === this.centerIndex) {
                cell.className += ' free-space';
                cell.value = 'Free space';
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
        const randomizeBtn = document.getElementById('randomizeBtn');
        const dateInput = document.getElementById('dateInput');

        clearBtn.addEventListener('click', () => this.clearGrid());
        exportBtn.addEventListener('click', () => this.exportAsImage());
        randomizeBtn.addEventListener('click', () => this.randomizeContent());
        
        // Date input formatting
        dateInput.addEventListener('input', this.formatDateInput.bind(this));
    }

    setupSidebar() {
        // Mobile modal functionality
        const mobileModal = document.getElementById('mobileModal');
        const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
        const modalClose = document.getElementById('modalClose');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        const toggleMobileModal = () => {
            if (window.innerWidth <= 768) {
                mobileModal.classList.toggle('open');
            }
        };

        sidebarToggleMobile.addEventListener('click', toggleMobileModal);
        modalClose.addEventListener('click', () => {
            mobileModal.classList.remove('open');
        });

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                document.getElementById(targetTab + '-tab').classList.add('active');
            });
        });

        // Sync mobile controls with desktop controls
        this.setupMobileControls();

        // Color controls (desktop and mobile)
        const colorInputs = {
            bgColor: document.getElementById('bgColor'),
            gridColor: document.getElementById('gridColor'),
            cellColor: document.getElementById('cellColor'),
            freeSpaceColor: document.getElementById('freeSpaceColor'),
            textColor: document.getElementById('textColor')
        };

        const mobileColorInputs = {
            bgColor: document.getElementById('bgColorMobile'),
            gridColor: document.getElementById('gridColorMobile'),
            cellColor: document.getElementById('cellColorMobile'),
            freeSpaceColor: document.getElementById('freeSpaceColorMobile'),
            textColor: document.getElementById('textColorMobile')
        };

        Object.entries(colorInputs).forEach(([key, input]) => {
            input.addEventListener('change', (e) => {
                this.currentTheme[key] = e.target.value;
                this.applyTheme();
                // Sync with mobile
                if (mobileColorInputs[key]) {
                    mobileColorInputs[key].value = e.target.value;
                }
            });
        });

        Object.entries(mobileColorInputs).forEach(([key, input]) => {
            input.addEventListener('change', (e) => {
                this.currentTheme[key] = e.target.value;
                this.applyTheme();
                // Sync with desktop
                if (colorInputs[key]) {
                    colorInputs[key].value = e.target.value;
                }
            });
        });

        // Reset colors buttons
        document.getElementById('resetColorsBtn').addEventListener('click', () => {
            this.resetColors();
        });
        document.getElementById('resetColorsBtnMobile').addEventListener('click', () => {
            this.resetColors();
        });
    }

    resetColors() {
        this.currentTheme = {
            bgColor: '#1a1a1a',
            gridColor: '#333333',
            cellColor: '#2a2a2a',
            freeSpaceColor: '#444444'
        };
        
        // Update both desktop and mobile inputs
        const allInputs = {
            ...document.getElementById('bgColor') && { bgColor: document.getElementById('bgColor') },
            ...document.getElementById('gridColor') && { gridColor: document.getElementById('gridColor') },
            ...document.getElementById('cellColor') && { cellColor: document.getElementById('cellColor') },
            ...document.getElementById('freeSpaceColor') && { freeSpaceColor: document.getElementById('freeSpaceColor') },
            ...document.getElementById('bgColorMobile') && { bgColorMobile: document.getElementById('bgColorMobile') },
            ...document.getElementById('gridColorMobile') && { gridColorMobile: document.getElementById('gridColorMobile') },
            ...document.getElementById('cellColorMobile') && { cellColorMobile: document.getElementById('cellColorMobile') },
            ...document.getElementById('freeSpaceColorMobile') && { freeSpaceColorMobile: document.getElementById('freeSpaceColorMobile') }
        };
        
        Object.entries(allInputs).forEach(([key, input]) => {
            if (input) {
                const colorKey = key.replace('Mobile', '');
                input.value = this.currentTheme[colorKey];
            }
        });
        
        this.applyTheme();
    }

    setupMobileControls() {
        // Mobile image upload functionality
        const imageUploadMobile = document.getElementById('imageUploadMobile');
        const uploadBtnMobile = document.getElementById('uploadBtnMobile');
        const centerImageUploadMobile = document.getElementById('centerImageUploadMobile');
        const centerImageBtnMobile = document.getElementById('centerImageBtnMobile');
        const removeCenterImageBtnMobile = document.getElementById('removeCenterImageBtnMobile');

        // Sync mobile upload with desktop functionality
        uploadBtnMobile.addEventListener('click', () => imageUploadMobile.click());
        centerImageBtnMobile.addEventListener('click', () => centerImageUploadMobile.click());
        
        imageUploadMobile.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        centerImageUploadMobile.addEventListener('change', (e) => {
            this.handleCenterImageUpload(e);
        });
        
        removeCenterImageBtnMobile.addEventListener('click', () => {
            this.removeCenterImage();
        });

        // Image upload functionality (desktop)
        const imageUpload = document.getElementById('imageUpload');
        const uploadBtn = document.getElementById('uploadBtn');
        const centerImageUpload = document.getElementById('centerImageUpload');
        const centerImageBtn = document.getElementById('centerImageBtn');
        const removeCenterImageBtn = document.getElementById('removeCenterImageBtn');

        uploadBtn.addEventListener('click', () => imageUpload.click());
        centerImageBtn.addEventListener('click', () => centerImageUpload.click());

        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        centerImageUpload.addEventListener('change', (e) => this.handleCenterImageUpload(e));
        removeCenterImageBtn.addEventListener('click', () => this.removeCenterImage());

        // Session management
        document.getElementById('saveSessionBtn').addEventListener('click', () => this.saveSession());
        document.getElementById('loadSessionBtn').addEventListener('click', () => this.showLoadSessionDialog());
    }

    applyTheme() {
        const root = document.documentElement;
        root.style.setProperty('--bg-color', this.currentTheme.bgColor);
        root.style.setProperty('--grid-color', this.currentTheme.gridColor);
        root.style.setProperty('--cell-color', this.currentTheme.cellColor);
        root.style.setProperty('--free-space-color', this.currentTheme.freeSpaceColor);
        root.style.setProperty('--text-color', this.currentTheme.textColor);
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.uploadedImages.push({
                        name: file.name,
                        data: e.target.result
                    });
                    this.updateImageGallery();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    handleCenterImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.centerImage = e.target.result;
                this.updateCenterCell();
            };
            reader.readAsDataURL(file);
        }
    }

    removeCenterImage() {
        this.centerImage = null;
        this.updateCenterCell();
    }

    updateCenterCell() {
        const centerCell = document.querySelector('.bingo-cell.free-space');
        if (this.centerImage) {
            centerCell.style.backgroundImage = `url(${this.centerImage})`;
            centerCell.value = '';
        } else {
            centerCell.style.backgroundImage = '';
            centerCell.value = 'Free space';
        }
    }

    updateImageGallery() {
        const gallery = document.getElementById('imageGallery');
        const mobileGallery = document.getElementById('imageGalleryMobile');
        
        // Clear both galleries
        gallery.innerHTML = '';
        mobileGallery.innerHTML = '';
        
        this.uploadedImages.forEach((image, index) => {
            // Create desktop image
            const img = document.createElement('img');
            img.src = image.data;
            img.className = 'gallery-image';
            img.draggable = true;
            img.dataset.imageIndex = index;
            img.title = image.name;
            
            img.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            gallery.appendChild(img);
            
            // Create mobile image
            const mobileImg = document.createElement('img');
            mobileImg.src = image.data;
            mobileImg.className = 'gallery-image';
            mobileImg.draggable = true;
            mobileImg.dataset.imageIndex = index;
            mobileImg.title = image.name;
            
            mobileImg.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            mobileGallery.appendChild(mobileImg);
        });
    }

    setupDragAndDrop() {
        const cells = document.querySelectorAll('.bingo-cell:not(.free-space)');
        
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                cell.classList.add('drag-over');
            });
            
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });
            
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                
                const imageIndex = e.dataTransfer.getData('text/plain');
                const image = this.uploadedImages[imageIndex];
                
                if (image) {
                    const cellIndex = parseInt(cell.dataset.cellIndex);
                    this.cellImages[cellIndex] = image.data;
                    cell.style.backgroundImage = `url(${image.data})`;
                    cell.classList.add('has-image');
                }
            });
            
            // Double click to remove image (desktop) or long press (mobile)
            cell.addEventListener('dblclick', () => {
                const cellIndex = parseInt(cell.dataset.cellIndex);
                delete this.cellImages[cellIndex];
                cell.style.backgroundImage = '';
                cell.classList.remove('has-image');
            });
            
            // Mobile touch support for image removal
            let touchTimer;
            cell.addEventListener('touchstart', (e) => {
                touchTimer = setTimeout(() => {
                    if (cell.classList.contains('has-image')) {
                        const cellIndex = parseInt(cell.dataset.cellIndex);
                        delete this.cellImages[cellIndex];
                        cell.style.backgroundImage = '';
                        cell.classList.remove('has-image');
                        
                        // Visual feedback
                        cell.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            cell.style.transform = '';
                        }, 150);
                    }
                }, 800); // Long press duration
            });
            
            cell.addEventListener('touchend', () => {
                clearTimeout(touchTimer);
            });
            
            cell.addEventListener('touchmove', () => {
                clearTimeout(touchTimer);
            });
        });
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

    randomizeContent() {
        const cells = document.querySelectorAll('.bingo-cell:not(.free-space)');
        const contents = [];
        const images = [];
        
        // Collect all content and images
        cells.forEach((cell, index) => {
            const cellIndex = parseInt(cell.dataset.cellIndex);
            contents.push(cell.value);
            images.push(this.cellImages[cellIndex] || null);
        });
        
        // Shuffle arrays
        for (let i = contents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [contents[i], contents[j]] = [contents[j], contents[i]];
            [images[i], images[j]] = [images[j], images[i]];
        }
        
        // Redistribute content and images
        cells.forEach((cell, index) => {
            const cellIndex = parseInt(cell.dataset.cellIndex);
            cell.value = contents[index];
            
            if (images[index]) {
                this.cellImages[cellIndex] = images[index];
                cell.style.backgroundImage = `url(${images[index]})`;
                cell.classList.add('has-image');
            } else {
                delete this.cellImages[cellIndex];
                cell.style.backgroundImage = '';
                cell.classList.remove('has-image');
            }
        });
    }

    clearGrid() {
        const cells = document.querySelectorAll('.bingo-cell:not(.free-space)');
        cells.forEach(cell => {
            cell.value = '';
            cell.style.height = '100px';
            cell.style.backgroundImage = '';
            cell.classList.remove('has-image');
        });
        
        // Clear cell images
        this.cellImages = {};
        
        // Clear header inputs
        document.getElementById('pseudoInput').value = '';
        document.getElementById('dateInput').value = '';
        document.getElementById('titleInput').value = 'Ultimate Bingo';
    }

    // Session Management
    saveSession() {
        const sessionName = prompt('Enter a name for this session:');
        if (!sessionName) return;

        const sessionData = {
            title: document.getElementById('titleInput').value,
            pseudo: document.getElementById('pseudoInput').value,
            date: document.getElementById('dateInput').value,
            cells: {},
            cellImages: this.cellImages,
            centerImage: this.centerImage,
            theme: this.currentTheme,
            uploadedImages: this.uploadedImages,
            timestamp: new Date().toISOString()
        };

        // Save cell content
        const cells = document.querySelectorAll('.bingo-cell');
        cells.forEach((cell, index) => {
            sessionData.cells[index] = cell.value;
        });

        // Save to localStorage
        const sessions = JSON.parse(localStorage.getItem('bingoSessions') || '{}');
        sessions[sessionName] = sessionData;
        localStorage.setItem('bingoSessions', JSON.stringify(sessions));

        alert(`Session "${sessionName}" saved successfully!`);
        this.loadSavedSessions();
    }

    loadSavedSessions() {
        const sessions = JSON.parse(localStorage.getItem('bingoSessions') || '{}');
        const sessionSelect = document.getElementById('sessionSelect');
        
        sessionSelect.innerHTML = '<option value="">Select a session...</option>';
        
        Object.keys(sessions).forEach(sessionName => {
            const option = document.createElement('option');
            option.value = sessionName;
            option.textContent = `${sessionName} (${new Date(sessions[sessionName].timestamp).toLocaleDateString()})`;
            sessionSelect.appendChild(option);
        });
    }

    showLoadSessionDialog() {
        const sessionSelect = document.getElementById('sessionSelect');
        sessionSelect.style.display = 'block';
        
        sessionSelect.onchange = () => {
            if (sessionSelect.value) {
                this.loadSession(sessionSelect.value);
                sessionSelect.style.display = 'none';
            }
        };
    }

    loadSession(sessionName) {
        const sessions = JSON.parse(localStorage.getItem('bingoSessions') || '{}');
        const sessionData = sessions[sessionName];
        
        if (!sessionData) {
            alert('Session not found!');
            return;
        }

        // Load basic data
        document.getElementById('titleInput').value = sessionData.title || 'Ultimate Bingo';
        document.getElementById('pseudoInput').value = sessionData.pseudo || '';
        document.getElementById('dateInput').value = sessionData.date || '';

        // Load theme
        this.currentTheme = sessionData.theme || this.currentTheme;
        this.applyTheme();
        
        // Update color inputs
        document.getElementById('bgColor').value = this.currentTheme.bgColor;
        document.getElementById('gridColor').value = this.currentTheme.gridColor;
        document.getElementById('cellColor').value = this.currentTheme.cellColor;
        document.getElementById('freeSpaceColor').value = this.currentTheme.freeSpaceColor;

        // Load uploaded images
        this.uploadedImages = sessionData.uploadedImages || [];
        this.updateImageGallery();

        // Load center image
        this.centerImage = sessionData.centerImage || null;
        this.updateCenterCell();

        // Load cell images
        this.cellImages = sessionData.cellImages || {};

        // Recreate grid to ensure proper setup
        this.createGrid();
        this.setupDragAndDrop();

        // Load cell content and images
        const cells = document.querySelectorAll('.bingo-cell');
        cells.forEach((cell, index) => {
            if (sessionData.cells[index]) {
                cell.value = sessionData.cells[index];
            }
            
            const cellIndex = parseInt(cell.dataset.cellIndex);
            if (this.cellImages[cellIndex]) {
                cell.style.backgroundImage = `url(${this.cellImages[cellIndex]})`;
                cell.classList.add('has-image');
            }
        });

        alert(`Session "${sessionName}" loaded successfully!`);
    }

    async exportAsImage() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) {
            alert('Error: Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Get header info including custom title
        const title = document.getElementById('titleInput').value || 'Ultimate Bingo';
        const pseudo = document.getElementById('pseudoInput').value || '';
        const date = document.getElementById('dateInput').value || '';
        
        // Set canvas size for high quality export (add space for header if needed)
        const scale = 2; // 2x resolution for crisp quality
        const cellSize = 200; // Larger cells for better quality
        const gridSize = this.gridSize;
        const borderWidth = 8;
        const padding = 60; // Generous padding around the entire image
        const titleHeight = title ? 60 : 0;
        const headerHeight = (pseudo || date) ? 80 : 0;
        const totalHeaderHeight = titleHeight + headerHeight;
        const gridWidth = gridSize * cellSize + (gridSize + 1) * borderWidth;
        const gridHeight = gridSize * cellSize + (gridSize + 1) * borderWidth;
        const canvasSize = gridWidth + (padding * 2);
        const totalHeight = gridHeight + totalHeaderHeight + (padding * 2);
        
        canvas.width = canvasSize * scale;
        canvas.height = totalHeight * scale;
        
        // Scale the context for high DPI
        ctx.scale(scale, scale);

        // Wait for all images to load before drawing
        const imagePromises = [];
        
        // Preload all cell images with timeout
        Object.entries(this.cellImages).forEach(([cellIndex, imageSrc]) => {
            const promise = new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // Set timeout for image loading
                const timeout = setTimeout(() => {
                    console.warn(`Image load timeout for cell ${cellIndex}`);
                    resolve({ cellIndex: parseInt(cellIndex), img: null });
                }, 10000); // 10 second timeout
                
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve({ cellIndex: parseInt(cellIndex), img });
                };
                img.onerror = (e) => {
                    clearTimeout(timeout);
                    console.error(`Failed to load image for cell ${cellIndex}:`, e);
                    resolve({ cellIndex: parseInt(cellIndex), img: null });
                };
                img.src = imageSrc;
            });
            imagePromises.push(promise);
        });

        // Preload center image with timeout
        if (this.centerImage) {
            const centerPromise = new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                const timeout = setTimeout(() => {
                    console.warn('Center image load timeout');
                    resolve({ isCenterImage: true, img: null });
                }, 10000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve({ isCenterImage: true, img });
                };
                img.onerror = (e) => {
                    clearTimeout(timeout);
                    console.error('Failed to load center image:', e);
                    resolve({ isCenterImage: true, img: null });
                };
                img.src = this.centerImage;
            });
            imagePromises.push(centerPromise);
        }

        const loadedImages = await Promise.all(imagePromises);
        const cellImageMap = {};
        let centerImageObj = null;

        loadedImages.forEach(result => {
            if (result.isCenterImage) {
                centerImageObj = result.img;
            } else if (result.img) {
                cellImageMap[result.cellIndex] = result.img;
            }
        });

        // Fill background with current theme color
        ctx.fillStyle = this.currentTheme.bgColor;
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
        
        // Draw title
        if (title) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Nunito, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(title, canvasSize / 2, padding + 30);
        }

        // Draw header info if present
        if (pseudo || date) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Nunito, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const headerY = padding + titleHeight + 40;
            if (pseudo && date) {
                ctx.fillText(`${pseudo} - ${date}`, canvasSize / 2, headerY);
            } else if (pseudo) {
                ctx.fillText(pseudo, canvasSize / 2, headerY);
            } else if (date) {
                ctx.fillText(date, canvasSize / 2, headerY);
            }
        }

        // No default logo anymore - removed to show "Free space" text
        const logo = new Image();
        let logoLoaded = false;

        // Draw grid
        const cells = document.querySelectorAll('.bingo-cell');
        
        for (let i = 0; i < cells.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = col * cellSize + (col + 1) * borderWidth + padding;
            const y = row * cellSize + (row + 1) * borderWidth + totalHeaderHeight + padding;

            // Draw cell background
            if (i === this.centerIndex) {
                ctx.fillStyle = this.currentTheme.freeSpaceColor;
            } else {
                ctx.fillStyle = this.currentTheme.cellColor;
            }
            ctx.fillRect(x, y, cellSize, cellSize);

            // Draw cell border
            ctx.strokeStyle = this.currentTheme.gridColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, cellSize, cellSize);

            // Draw center cell content
            if (i === this.centerIndex) {
                // Draw custom center image if available
                if (centerImageObj) {
                    const img = centerImageObj;
                    const logoSize = cellSize * 0.75;
                    const logoX = x + (cellSize - logoSize) / 2;
                    const logoY = y + (cellSize - logoSize) / 2;
                    
                    // Calculate aspect ratios to crop and center like CSS background-size: cover
                    const imgAspect = img.width / img.height;
                    const logoAspect = 1; // Square logo area
                    
                    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
                    
                    if (imgAspect > logoAspect) {
                        // Image is wider - crop sides
                        sourceWidth = img.height * logoAspect;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        // Image is taller - crop top/bottom
                        sourceHeight = img.width / logoAspect;
                        sourceY = (img.height - sourceHeight) / 2;
                    }
                    
                    // Draw the cropped center image
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, logoX, logoY, logoSize, logoSize);
                } else {
                    // Show "Free space" text instead of logo
                    ctx.fillStyle = this.currentTheme.textColor;
                    ctx.font = 'bold 28px Nunito, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Free space', x + cellSize / 2, y + cellSize / 2);
                }
            } else {
                // Draw cell image if available
                const cellIndex = parseInt(cells[i].dataset.cellIndex);
                if (cellImageMap[cellIndex]) {
                    const img = cellImageMap[cellIndex];
                    
                    // Calculate aspect ratios to crop and center like CSS background-size: cover
                    const imgAspect = img.width / img.height;
                    const cellAspect = 1; // Square cell
                    
                    let drawWidth, drawHeight, drawX, drawY;
                    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
                    
                    if (imgAspect > cellAspect) {
                        // Image is wider - crop sides
                        sourceWidth = img.height * cellAspect;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        // Image is taller - crop top/bottom
                        sourceHeight = img.width / cellAspect;
                        sourceY = (img.height - sourceHeight) / 2;
                    }
                    
                    // Draw the cropped image to fill the cell
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, cellSize, cellSize);
                    
                    // Draw text overlay if there's text
                    const text = cells[i].value || '';
                    if (text) {
                        // Semi-transparent overlay for better text readability
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        ctx.fillRect(x, y, cellSize, cellSize);
                        
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 22px Nunito, Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        // Word wrap for long text - same as text-only cells
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
                        
                        // Draw lines centered in the full cell - same as text-only cells
                        const lineHeight = 28;
                        const startY = y + cellSize / 2 - (lines.length - 1) * lineHeight / 2;
                        
                        lines.forEach((line, index) => {
                            ctx.fillText(line, x + cellSize / 2, startY + index * lineHeight);
                        });
                    }
                } else {
                    // Draw text for regular cells
                    const text = cells[i].value || '';
                    if (text) {
                        ctx.fillStyle = this.currentTheme.textColor;
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
        }

        // Download the canvas
        this.downloadCanvas(canvas);
    }
    
    downloadCanvas(canvas) {
        try {
            // Get the title for filename
            const title = document.getElementById('titleInput').value || 'Ultimate Bingo';
            const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `${sanitizedTitle}_${timestamp}.jpg`;
            
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            
            // Check if dataURL is valid
            if (!dataURL || dataURL === 'data:,') {
                throw new Error('Canvas failed to generate image data');
            }
            
            // Create download link
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = filename;
            a.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            console.log(`Exported bingo card as: ${filename}`);
        } catch (error) {
            console.error('Export failed:', error.message || error);
            
            // More specific error messages
            if (error.message && error.message.includes('tainted')) {
                alert('Export failed: Image security restrictions. Try uploading images from your device instead of external sources.');
            } else if (error.message && error.message.includes('Canvas')) {
                alert('Export failed: Canvas rendering error. Try clearing the grid and recreating your bingo card.');
            } else {
                alert(`Export failed: ${error.message || 'Unknown error'}. Please try again.`);
            }
        }
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
