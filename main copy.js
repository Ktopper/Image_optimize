const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prompt = require('electron-prompt');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

async function processImage(filePath, outputPath, percentage, format) {
  try {
    const imageMetadata = await sharp(filePath).metadata();
    const outputFormat = format || imageMetadata.format;

    const options = {};
    if (['png', 'webp'].includes(outputFormat)) {
      options.alphaQuality = 100;
    }

    await sharp(filePath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat(outputFormat, options)
      .toFile(outputPath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}
async function selectAndResizeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '50',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage)) {
    // TODO: Handle invalid input
    return
  }

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err)
        return
      } 

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file)
          const imageMetadata = await sharp(filePath).metadata()

          const outputPath = path.join(dirPath, 'big_' + file)
          fs.renameSync(filePath, outputPath)

          await sharp(outputPath)
            .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
            .toFormat('jpeg')
            .toFile(filePath)
        }
      })
    })
  }
}
async function selectAndMakeImageSquare() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0]; // Assuming single selection
    makeImageSquare(filePath);
  }
}

async function makeImageSquare(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);

    const outputPath = path.join(path.dirname(filePath), `square_${path.basename(filePath)}`);
    
    await sharp(filePath)
      .extract({
        width: size,
        height: size,
        left: (metadata.width - size) / 2,
        top: (metadata.height - size) / 2,
      })
      .toFile(outputPath);

    console.log(`Square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making image square:', error);
  }
}
// Favicon
async function selectAndCreateFavicon() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    createFavicon(filePath);
  }
}
async function createFavicon(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    const targetSize = 50;

    const outputPath = path.join(path.dirname(filePath), `favicon_${path.basename(filePath, path.extname(filePath))}.png`);

    await sharp(filePath)
      .extract({ width: size, height: size, left: (metadata.width - size) / 2, top: (metadata.height - size) / 2 })
      .resize(targetSize, targetSize)
      .toFormat('png')
      .toFile(outputPath);

    console.log(`Favicon created at ${outputPath}`);
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}
async function selectAndResizeSingleImage() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the image to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage)) {
    // TODO: Handle invalid input
    return
  }

  for (let filePath of filePaths) {
    const imageMetadata = await sharp(filePath).metadata()
    const outputPath = path.join(path.dirname(filePath), 'big_' + path.basename(filePath))
    
    fs.renameSync(filePath, outputPath)
    
    await sharp(outputPath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat('jpeg')
      .toFile(filePath)
  }
}


async function selectAndMakeImageSquare700() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    makeImageSquareAndResize(filePath);
  }
}

async function makeImageSquareAndResize(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    const targetSize = 700;
    let extractSize = size;

    // If the original square size is smaller than 700px, do not scale it.
    // This logic assumes you want to maintain the original size if it's smaller than 700px.
    if (size > targetSize) {
      extractSize = targetSize;
    }

    const outputPath = path.join(path.dirname(filePath), `square_700_${path.basename(filePath)}`);
    
    let image = sharp(filePath)
      .extract({ width: size, height: size, left: (metadata.width - size) / 2, top: (metadata.height - size) / 2 });

    // Only resize if the extracted square is larger than 700px
    if (size > targetSize) {
      image = image.resize(targetSize, targetSize);
    }

    await image.toFormat('webp').toFile(outputPath);n

    console.log(`700x700 square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making 700x700 square image:', error);
  }
}


async function selectAndResizeLargeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  const sizeThreshold = await prompt({
    title: 'Enter size threshold',
    label: 'Enter the file size threshold (in KB) to resize images above:',
    value: '200',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  const dimensionThreshold = await prompt({
    title: 'Enter dimension threshold',
    label: 'Enter the dimension threshold (in px) to resize images above:',
    value: '800',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage) || isNaN(sizeThreshold) || isNaN(dimensionThreshold)) {
    // TODO: Handle invalid input
    return
  }

  // Convert size threshold from KB to bytes for comparison
  const sizeThresholdInBytes = sizeThreshold * 1024;

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err)
        return
      } 

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file)
          const stats = fs.statSync(filePath);

          const imageMetadata = await sharp(filePath).metadata()

          // Only process files larger than the threshold
          if(stats.size > sizeThresholdInBytes && (imageMetadata.width > dimensionThreshold || imageMetadata.height > dimensionThreshold)) {
            const outputPath = path.join(dirPath, 'big_' + file)
            fs.renameSync(filePath, outputPath)

            await sharp(outputPath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('jpeg')
              .toFile(filePath)
          }
        }
      })
    })
  }
}
async function resizeWebpImages() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!directoryPaths) return;  // Handle case where the user closes the dialog

    const percentage = await prompt({
      title: 'Enter percentage',
      label: 'Enter the percentage (in %) to resize the webp images to:',
      value: '80',
      inputAttrs: {
        type: 'number'
      },
      type: 'input'
    });

    if (isNaN(percentage)) {
      // Handle invalid input, maybe show a dialog or log it
      console.error("Invalid percentage value provided");
      return;
    }

    for (let dirPath of directoryPaths) {
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          console.error('Unable to scan directory: ' + err);
          return;
        }

        files.forEach(async (file) => {
          if (path.extname(file).toLowerCase() === '.webp') {
            const filePath = path.join(dirPath, file);
            
            // Rename the original file to have "old_" prefix
            const oldFilePath = path.join(dirPath, 'old_' + file);
            fs.renameSync(filePath, oldFilePath);

            // Get image metadata
            const imageMetadata = await sharp(oldFilePath).metadata();

            // Resize the image and save it with its original name
            await sharp(oldFilePath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('webp')
              .toFile(filePath);
          }
        });
      });
    }
  } catch (error) {
    console.error("Error resizing webp images:", error);
  }
} 
ipcMain.on('convert-all-images-to-png', async (event) => {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!directoryPaths || directoryPaths.length === 0) {
    return; // Handle case where no directory was selected
  }

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.error('Unable to scan directory: ' + err);
        return;
      }

      // Filter image files based on extensions
      const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase()));

      if (imageFiles.length === 0) {
        console.log('No image files found in the selected directory.');
        return;
      }

      imageFiles.forEach(async (file) => {
        const filePath = path.join(dirPath, file);
        const outputPath = path.join(dirPath, path.basename(file, path.extname(file)) + '.png');

        try {
          // Convert each image to PNG
          await sharp(filePath)
            .toFormat('png', { compressionLevel: 9 })
            .toFile(outputPath);
          
          console.log(`Converted ${file} to PNG at ${outputPath}`);
        } catch (error) {
          console.error(`Error converting ${file} to PNG:`, error);
        }
      });
    });
  }
});
ipcMain.on('make-image-square-700', (event) => {
  selectAndMakeImageSquare700();
});

ipcMain.on('make-image-square', (event) => {
  console.log('Received make-image-square event');
  selectAndMakeImageSquare();
});

ipcMain.on('create-favicon', (event) => {
  selectAndCreateFavicon();
});

ipcMain.on('resize-webp-images', (event) => {
  resizeWebpImages();
});

ipcMain.on('resize-single-image', (event) => {
  selectAndResizeSingleImage();
});

ipcMain.on('resize-all-images', (event) => {
  selectAndResizeImages();
});

ipcMain.on('resize-large-images', (event) => {
  selectAndResizeLargeImages();
});

ipcMain.on('convert-single-image-to-webp', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
  });

  filePaths.forEach(async filePath => {
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.webp');
    await processImage(filePath, outputPath, 100, 'webp');
  });
});

ipcMain.on('convert-all-images-to-webp', async (event) => {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }
      
      files.forEach(async file => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const outputPath = path.join(dirPath, path.basename(file, path.extname(file)) + '.webp');
          await processImage(filePath, outputPath, 100, 'webp');
        }
      });
    });
  }
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});