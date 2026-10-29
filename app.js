'use strict';

(() => {
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  const MAX_OUTPUT_PIXELS = 40_000_000;
  const MAX_DIMENSION = 12000;
  const MIN_TARGET_KB = 5;
  const MAX_TARGET_KB = 20000;

  const presets = {
    original: { label: 'Original dimensions', width: null, height: null, mode: 'contain' },
    custom: { label: 'Custom dimensions', width: null, height: null, mode: null },
    'instagram-square': { label: 'Instagram square post', width: 1080, height: 1080, mode: 'cover' },
    'instagram-portrait': { label: 'Instagram portrait post', width: 1080, height: 1350, mode: 'cover' },
    'instagram-story': { label: 'Instagram Story / Reel', width: 1080, height: 1920, mode: 'cover' },
    'youtube-thumbnail': { label: 'YouTube thumbnail', width: 1280, height: 720, mode: 'cover' },
    'youtube-banner': { label: 'YouTube channel banner', width: 2560, height: 1440, mode: 'cover' },
    'youtube-profile': { label: 'YouTube profile picture', width: 800, height: 800, mode: 'cover' },
    'facebook-post': { label: 'Facebook post', width: 1200, height: 630, mode: 'cover' },
    'facebook-cover': { label: 'Facebook cover', width: 1640, height: 624, mode: 'cover' },
    'tiktok-video': { label: 'TikTok video / cover', width: 1080, height: 1920, mode: 'cover' },
    'whatsapp-status': { label: 'WhatsApp status', width: 1080, height: 1920, mode: 'cover' },
    'linkedin-post': { label: 'LinkedIn post', width: 1200, height: 627, mode: 'cover' },
    'pinterest-pin': { label: 'Pinterest pin', width: 1000, height: 1500, mode: 'cover' },
    'x-post': { label: 'X post', width: 1600, height: 900, mode: 'cover' },
    'wallpaper-hd': { label: 'HD wallpaper', width: 1280, height: 720, mode: 'cover' },
    'wallpaper-laptop': { label: 'Laptop wallpaper', width: 1366, height: 768, mode: 'cover' },
    'wallpaper-fhd': { label: 'Full HD wallpaper', width: 1920, height: 1080, mode: 'cover' },
    'wallpaper-qhd': { label: 'QHD wallpaper', width: 2560, height: 1440, mode: 'cover' },
    'wallpaper-4k': { label: '4K UHD wallpaper', width: 3840, height: 2160, mode: 'cover' },
    'wallpaper-ultrawide': { label: 'Ultrawide wallpaper', width: 3440, height: 1440, mode: 'cover' },
    'wallpaper-phone': { label: 'Phone wallpaper', width: 1080, height: 2400, mode: 'cover' },
    'square-photo': { label: 'Square photo', width: 600, height: 600, mode: 'cover' }
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    fileInput: $('fileInput'), dropzone: $('dropzone'), browseButton: $('browseButton'),
    sourceCard: $('sourceCard'), sourcePreview: $('sourcePreview'), sourceName: $('sourceName'), sourceMeta: $('sourceMeta'), sourceBytes: $('sourceBytes'),
    replaceButton: $('replaceButton'), uploadError: $('uploadError'), presetSelect: $('presetSelect'), widthInput: $('widthInput'),
    heightInput: $('heightInput'), lockRatioButton: $('lockRatioButton'), ratioLabel: $('ratioLabel'), fitMode: $('fitMode'),
    formatSelect: $('formatSelect'), qualityRange: $('qualityRange'), qualityValue: $('qualityValue'), qualityBlock: $('qualityBlock'),
    targetEnabled: $('targetEnabled'), targetOptions: $('targetOptions'), targetKB: $('targetKB'), allowDownscale: $('allowDownscale'),
    backgroundColor: $('backgroundColor'), backgroundRow: $('backgroundRow'), fitHint: $('fitHint'), processButton: $('processButton'),
    processStatus: $('processStatus'), resultPanel: $('resultPanel'), resultSummary: $('resultSummary'), startOverButton: $('startOverButton'),
    outputPreview: $('outputPreview'), outputName: $('outputName'), outputDimensions: $('outputDimensions'), outputSize: $('outputSize'),
    outputFormat: $('outputFormat'), outputChange: $('outputChange'), targetNotice: $('targetNotice'), downloadButton: $('downloadButton'),
    toast: $('toast'),
    contactButton: $('contactButton'), footerContactButton: $('footerContactButton'),
    contactDialog: $('contactDialog'), closeContactButton: $('closeContactButton'),
    copyEmailButton: $('copyEmailButton'), contactFeedback: $('contactFeedback'),
    supportEmailText: $('supportEmailText')
  };

  const state = {
    file: null,
    image: null,
    sourceUrl: null,
    outputUrl: null,
    outputBlob: null,
    width: null,
    height: null,
    ratio: 16 / 9,
    ratioLocked: true,
    toastTimer: null,
    processing: false
  };

  const supportedSourceTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-ms-bmp']);

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function cleanBaseName(name) {
    return (name || 'image').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'image';
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => el.toast.classList.remove('show'), 3000);
  }

  function setStatus(message, kind = '') {
    el.processStatus.textContent = message;
    el.processStatus.classList.toggle('is-error', kind === 'error');
    el.processStatus.classList.toggle('is-success', kind === 'success');
  }

  function setUploadError(message = '') {
    el.uploadError.textContent = message;
    el.uploadError.hidden = !message;
  }

  function readDims() {
    const width = Number.parseInt(el.widthInput.value, 10);
    const height = Number.parseInt(el.heightInput.value, 10);
    return { width, height };
  }

  function actualImageWidth(image) {
    return image ? (image.naturalWidth || image.videoWidth || image.width) : 0;
  }

  function actualImageHeight(image) {
    return image ? (image.naturalHeight || image.videoHeight || image.height) : 0;
  }

  function updateRatioLabel() {
    const dims = readDims();
    if (Number.isFinite(dims.width) && Number.isFinite(dims.height) && dims.width > 0 && dims.height > 0) {
      el.ratioLabel.textContent = state.ratioLocked ? `Ratio locked · ${simplifyRatio(dims.width, dims.height)}` : `Current ratio · ${simplifyRatio(dims.width, dims.height)}`;
    } else {
      el.ratioLabel.textContent = state.ratioLocked ? 'Ratio locked' : 'Ratio unlocked';
    }
    el.lockRatioButton.classList.toggle('is-locked', state.ratioLocked);
    el.lockRatioButton.setAttribute('aria-pressed', String(state.ratioLocked));
    el.lockRatioButton.setAttribute('aria-label', state.ratioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio');
    el.lockRatioButton.title = state.ratioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio';
  }

  function greatestCommonDivisor(a, b) {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) [x, y] = [y, x % y];
    return x || 1;
  }

  function simplifyRatio(width, height) {
    const divisor = greatestCommonDivisor(width, height);
    return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
  }

  function updateQualityUi() {
    const isPng = el.formatSelect.value === 'image/png';
    el.qualityRange.disabled = isPng;
    el.qualityBlock.style.opacity = isPng ? '.55' : '1';
    el.qualityValue.textContent = isPng ? 'Lossless' : `${el.qualityRange.value}%`;
    el.qualityBlock.title = isPng ? 'PNG uses lossless encoding; quality slider does not apply.' : '';
  }

  function updateFitHint() {
    const hints = {
      cover: 'Fill the frame edge-to-edge; parts of the image may be cropped.',
      contain: 'Keep the whole image visible; empty space is filled with your background color.',
      stretch: 'Force the image to the exact dimensions; this may distort it.'
    };
    el.fitHint.textContent = hints[el.fitMode.value] || hints.cover;
  }

  function setDimensions(width, height, { lock = true } = {}) {
    if (!width || !height) return;
    el.widthInput.value = Math.round(width);
    el.heightInput.value = Math.round(height);
    state.ratio = width / height;
    state.ratioLocked = lock;
    updateRatioLabel();
  }

  function applyPreset(value) {
    const preset = presets[value];
    if (!preset) return;
    if (value === 'original') {
      if (state.image) {
        setDimensions(actualImageWidth(state.image), actualImageHeight(state.image));
      }
      el.fitMode.value = 'contain';
    } else if (value === 'custom') {
      const dims = readDims();
      if (dims.width > 0 && dims.height > 0) state.ratio = dims.width / dims.height;
      updateRatioLabel();
    } else {
      setDimensions(preset.width, preset.height);
      if (preset.mode) el.fitMode.value = preset.mode;
    }
    updateFitHint();
    if (el.resultPanel.hidden === false) el.resultPanel.hidden = true;
    setStatus(state.image ? 'Settings updated. Export when you are ready.' : 'Add an image to get started.');
  }

  function setProcessing(isProcessing) {
    state.processing = isProcessing;
    el.processButton.disabled = isProcessing || !state.image;
    el.processButton.querySelector('span').textContent = isProcessing ? 'Processing image…' : 'Resize & export image';
    el.processButton.setAttribute('aria-busy', String(isProcessing));
  }

  async function decodeFile(file) {
    if ('createImageBitmap' in window) {
      try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch (_) {
        // Some browsers do not accept the options object; try the standard call.
        return await createImageBitmap(file);
      }
    }
    return new Promise((resolve, reject) => {
      const tempUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(tempUrl); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(tempUrl); reject(new Error('This image could not be opened by your browser. Try a JPG, PNG or WebP image.')); };
      img.src = tempUrl;
    });
  }

  async function loadFile(file) {
    if (!file) return;
    setUploadError('');
    if (!file.type || !supportedSourceTypes.has(file.type.toLowerCase())) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
      if (!allowedExt.includes(ext)) {
        setUploadError('That file type is not supported in this version. Please choose a JPG, PNG, WebP, GIF or BMP image. HEIC/HEIF and TIFF are not supported yet.');
        return;
      }
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('This image is larger than 30 MB. Please choose a smaller file to avoid slowing down your browser.');
      return;
    }
    if (!file.size) {
      setUploadError('This file appears to be empty. Please choose a different image.');
      return;
    }

    setStatus('Opening image…');
    try {
      const decoded = await decodeFile(file);
      const width = actualImageWidth(decoded);
      const height = actualImageHeight(decoded);
      if (!width || !height) throw new Error('The image dimensions could not be read. Try a different image.');
      if (width * height > 150_000_000) {
        if (typeof decoded.close === 'function') decoded.close();
        throw new Error('This image has too many pixels for a reliable browser edit. Please choose a smaller image.');
      }

      releaseCurrentImage();
      state.file = file;
      state.image = decoded;
      state.sourceUrl = URL.createObjectURL(file);
      el.sourcePreview.src = state.sourceUrl;
      el.sourceName.textContent = file.name;
      el.sourceName.title = file.name;
      el.sourceMeta.textContent = `${width.toLocaleString()} × ${height.toLocaleString()} px`;
      el.sourceBytes.textContent = formatBytes(file.size);
      el.dropzone.hidden = true;
      el.sourceCard.hidden = false;
      el.processButton.disabled = false;
      if (el.presetSelect.value === 'original') {
        setDimensions(width, height);
      } else {
        const selected = presets[el.presetSelect.value];
        if (selected && selected.width && selected.height) {
          setDimensions(selected.width, selected.height);
          if (selected.mode) el.fitMode.value = selected.mode;
        }
      }
      updateRatioLabel();
      updateFitHint();
      el.resultPanel.hidden = true;
      setStatus('Image loaded. Choose your settings and export.');
      showToast('Image ready — your file stays on this device.');
    } catch (error) {
      setUploadError(error && error.message ? error.message : 'Could not open this image. Try a JPG, PNG or WebP file.');
      setStatus('Could not open image.', 'error');
    }
  }

  function releaseCurrentImage() {
    if (state.image && typeof state.image.close === 'function') {
      try { state.image.close(); } catch (_) { /* Already closed. */ }
    }
    state.image = null;
    state.file = null;
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.sourceUrl = null;
    if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
    state.outputUrl = null;
    state.outputBlob = null;
  }

  function openFilePicker() {
    el.fileInput.click();
  }

  function syncEditedDimension(which) {
    const width = Number.parseInt(el.widthInput.value, 10);
    const height = Number.parseInt(el.heightInput.value, 10);
    if (state.ratioLocked && state.ratio > 0) {
      if (which === 'width' && Number.isFinite(width) && width > 0) {
        el.heightInput.value = Math.max(1, Math.round(width / state.ratio));
      } else if (which === 'height' && Number.isFinite(height) && height > 0) {
        el.widthInput.value = Math.max(1, Math.round(height * state.ratio));
      }
    } else if (width > 0 && height > 0) {
      state.ratio = width / height;
    }
    updateRatioLabel();
    if (!el.resultPanel.hidden) el.resultPanel.hidden = true;
  }

  function validateDimensions(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new Error('Enter a valid width and height greater than zero.');
    }
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Each dimension must be ${MAX_DIMENSION.toLocaleString()} px or less.`);
    }
    if (width * height > MAX_OUTPUT_PIXELS) {
      throw new Error('That output is larger than 40 megapixels. Choose smaller dimensions to keep your browser responsive.');
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Your browser could not export this image. Try another format or smaller dimensions.'));
          if (blob.type && blob.type !== type) {
            return reject(new Error(`This browser could not export ${type.replace('image/', '').toUpperCase()}. Try JPG or PNG instead.`));
          }
          resolve(blob);
        }, type, quality);
      } catch (error) {
        reject(error);
      }
    });
  }

  async function renderBlob(width, height, mode, format, quality, background) {
    validateDimensions(Math.round(width), Math.round(height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const context = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
    if (!context) throw new Error('Your browser could not start the image editor. Try a modern version of Chrome, Edge, Firefox or Safari.');

    if (format === 'image/jpeg' || mode === 'contain') {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const sourceWidth = actualImageWidth(state.image);
    const sourceHeight = actualImageHeight(state.image);
    if (mode === 'stretch') {
      context.drawImage(state.image, 0, 0, canvas.width, canvas.height);
    } else {
      const scale = mode === 'contain'
        ? Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight)
        : Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const dx = (canvas.width - drawWidth) / 2;
      const dy = (canvas.height - drawHeight) / 2;
      context.drawImage(state.image, dx, dy, drawWidth, drawHeight);
    }

    try {
      return await canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
    } finally {
      // Release the backing pixel buffer as soon as the blob is ready.
      canvas.width = 1;
      canvas.height = 1;
    }
  }

  async function findBlobForTarget(width, height, mode, format, requestedQuality, background, targetBytes) {
    if (format === 'image/png') {
      const blob = await renderBlob(width, height, mode, format, requestedQuality, background);
      return { blob, quality: null, hit: blob.size <= targetBytes };
    }

    const highQuality = Math.max(0.1, Math.min(1, requestedQuality));
    const highBlob = await renderBlob(width, height, mode, format, highQuality, background);
    if (highBlob.size <= targetBytes) return { blob: highBlob, quality: highQuality, hit: true };

    const minQuality = 0.1;
    const minBlob = await renderBlob(width, height, mode, format, minQuality, background);
    if (minBlob.size > targetBytes) return { blob: minBlob, quality: minQuality, hit: false };

    let low = minQuality;
    let high = highQuality;
    let bestBlob = minBlob;
    let bestQuality = minQuality;
    for (let i = 0; i < 9; i += 1) {
      const mid = (low + high) / 2;
      const candidate = await renderBlob(width, height, mode, format, mid, background);
      if (candidate.size <= targetBytes) {
        bestBlob = candidate;
        bestQuality = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    return { blob: bestBlob, quality: bestQuality, hit: bestBlob.size <= targetBytes };
  }

  async function processImage() {
    if (!state.image || state.processing) return;
    setUploadError('');
    const dimensions = readDims();
    const width = dimensions.width;
    const height = dimensions.height;
    const format = el.formatSelect.value;
    const mode = el.fitMode.value;
    const quality = Number(el.qualityRange.value) / 100;
    const background = el.backgroundColor.value || '#ffffff';
    let targetBytes = null;

    try {
      validateDimensions(width, height);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(format)) {
        throw new Error('Choose JPG, PNG or WebP as the output format.');
      }
      if (el.targetEnabled.checked) {
        const targetKb = Number(el.targetKB.value);
        if (!Number.isFinite(targetKb) || targetKb < MIN_TARGET_KB || targetKb > MAX_TARGET_KB) {
          throw new Error(`Enter a target file size between ${MIN_TARGET_KB} KB and ${MAX_TARGET_KB.toLocaleString()} KB.`);
        }
        targetBytes = Math.round(targetKb * 1024);
      }
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }

    setProcessing(true);
    el.resultPanel.hidden = true;
    setStatus('Processing locally in your browser…');

    try {
      let finalWidth = width;
      let finalHeight = height;
      let result;
      let targetHit = true;
      let requestedQualityUsed = format === 'image/png' ? null : quality;
      if (targetBytes) {
        result = await findBlobForTarget(finalWidth, finalHeight, mode, format, quality, background, targetBytes);
        targetHit = result.hit;
        requestedQualityUsed = result.quality;
        if (!targetHit && el.allowDownscale.checked) {
          const minDimension = Math.min(160, Math.min(width, height));
          let attempt = 0;
          while (!targetHit && attempt < 30 && Math.min(finalWidth, finalHeight) > minDimension) {
            finalWidth = Math.max(1, Math.round(finalWidth * 0.9));
            finalHeight = Math.max(1, Math.round(finalHeight * 0.9));
            result = await findBlobForTarget(finalWidth, finalHeight, mode, format, quality, background, targetBytes);
            targetHit = result.hit;
            requestedQualityUsed = result.quality;
            attempt += 1;
          }
        }
      } else {
        result = { blob: await renderBlob(finalWidth, finalHeight, mode, format, quality, background), quality, hit: true };
      }

      const blob = result.blob;
      const ext = format === 'image/jpeg' ? 'jpg' : (format === 'image/png' ? 'png' : 'webp');
      const outputFileName = `${cleanBaseName(state.file.name)}-pixelfit.${ext}`;
      if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
      state.outputBlob = blob;
      state.outputUrl = URL.createObjectURL(blob);
      el.outputPreview.src = state.outputUrl;
      el.outputPreview.alt = `Processed image preview at ${finalWidth} by ${finalHeight} pixels`;
      el.outputName.textContent = outputFileName;
      el.outputName.title = outputFileName;
      el.outputDimensions.textContent = `${finalWidth.toLocaleString()} × ${finalHeight.toLocaleString()}`;
      el.outputSize.textContent = formatBytes(blob.size);
      el.outputFormat.textContent = ext.toUpperCase();
      const difference = blob.size - state.file.size;
      if (difference < 0) {
        const savedPercent = Math.round((Math.abs(difference) / state.file.size) * 100);
        el.outputChange.textContent = `${savedPercent}% smaller`;
      } else if (difference > 0) {
        const largerPercent = Math.round((difference / state.file.size) * 100);
        el.outputChange.textContent = `${largerPercent}% larger`;
      } else {
        el.outputChange.textContent = 'Same size';
      }
      el.downloadButton.href = state.outputUrl;
      el.downloadButton.download = outputFileName;
      el.resultSummary.textContent = `${presets[el.presetSelect.value]?.label || 'Custom image'} · ready to download`;
      el.targetNotice.hidden = true;
      el.targetNotice.classList.remove('success');
      if (targetBytes) {
        el.targetNotice.hidden = false;
        if (targetHit) {
          el.targetNotice.textContent = `Target reached: ${formatBytes(blob.size)} is within your ${el.targetKB.value} KB limit.${(finalWidth !== width || finalHeight !== height) ? ' Dimensions were reduced to meet the target.' : ''}`;
          el.targetNotice.classList.add('success');
        } else {
          el.targetNotice.textContent = `Could not get below ${el.targetKB.value} KB with these settings. The best attempt is ${formatBytes(blob.size)}. Try a larger limit, JPG/WebP, or enable “Reduce dimensions if needed”.`;
        }
      }
      el.resultPanel.hidden = false;
      if (targetBytes && !targetHit) {
        setStatus(`Done, but the ${el.targetKB.value} KB target was not reached. See the note below the result.`, 'error');
      } else {
        setStatus('Done — your image is ready to download.', 'success');
      }
      el.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setStatus(error && error.message ? error.message : 'Something went wrong while exporting the image. Try a different format or smaller dimensions.', 'error');
    } finally {
      setProcessing(false);
      if (state.image) el.processButton.disabled = false;
    }
  }

  function startOver() {
    releaseCurrentImage();
    el.fileInput.value = '';
    el.dropzone.hidden = false;
    el.sourceCard.hidden = true;
    el.resultPanel.hidden = true;
    el.outputPreview.removeAttribute('src');
    el.outputName.textContent = 'image-pixelfit.jpg';
    el.processButton.disabled = true;
    setUploadError('');
    setStatus('Add an image to get started.');
    el.presetSelect.value = 'original';
    el.fitMode.value = 'contain';
    el.formatSelect.value = 'image/jpeg';
    el.qualityRange.value = '88';
    el.targetEnabled.checked = false;
    el.targetOptions.hidden = true;
    el.targetKB.value = '300';
    el.allowDownscale.checked = false;
    el.backgroundColor.value = '#ffffff';
    state.ratioLocked = true;
    updateQualityUi();
    updateFitHint();
    setDimensions(1920, 1080);
  }

  el.fileInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) loadFile(file);
  });
  el.browseButton.addEventListener('click', (event) => { event.stopPropagation(); openFilePicker(); });
  el.replaceButton.addEventListener('click', openFilePicker);
  el.dropzone.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    openFilePicker();
  });
  el.dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  });
  ['dragenter', 'dragover'].forEach((eventName) => el.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    el.dropzone.classList.add('drag-over');
  }));
  ['dragleave', 'drop'].forEach((eventName) => el.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    el.dropzone.classList.remove('drag-over');
  }));
  el.dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  el.presetSelect.addEventListener('change', () => applyPreset(el.presetSelect.value));
  el.widthInput.addEventListener('input', () => syncEditedDimension('width'));
  el.heightInput.addEventListener('input', () => syncEditedDimension('height'));
  el.widthInput.addEventListener('change', () => {
    const width = Number.parseInt(el.widthInput.value, 10);
    if (!Number.isFinite(width) || width < 1) el.widthInput.value = '1';
    else if (width > MAX_DIMENSION) el.widthInput.value = String(MAX_DIMENSION);
    syncEditedDimension('width');
  });
  el.heightInput.addEventListener('change', () => {
    const height = Number.parseInt(el.heightInput.value, 10);
    if (!Number.isFinite(height) || height < 1) el.heightInput.value = '1';
    else if (height > MAX_DIMENSION) el.heightInput.value = String(MAX_DIMENSION);
    syncEditedDimension('height');
  });
  el.lockRatioButton.addEventListener('click', () => {
    const dims = readDims();
    if (dims.width > 0 && dims.height > 0) state.ratio = dims.width / dims.height;
    state.ratioLocked = !state.ratioLocked;
    updateRatioLabel();
  });
  el.fitMode.addEventListener('change', updateFitHint);
  el.formatSelect.addEventListener('change', updateQualityUi);
  el.qualityRange.addEventListener('input', updateQualityUi);
  el.targetEnabled.addEventListener('change', () => { el.targetOptions.hidden = !el.targetEnabled.checked; });
  el.processButton.addEventListener('click', processImage);
  el.startOverButton.addEventListener('click', startOver);

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-preset');
      el.presetSelect.value = presets[value] ? value : 'custom';
      if (button.dataset.format) el.formatSelect.value = button.dataset.format;
      if (button.dataset.target) {
        el.targetEnabled.checked = true;
        el.targetKB.value = button.dataset.target;
        el.targetOptions.hidden = false;
      }
      applyPreset(el.presetSelect.value);
      updateQualityUi();
      document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!state.image) {
        showToast('Choose an image above, then apply these settings.');
      } else {
        showToast('Settings selected. Export when you are ready.');
      }
    });
  });

  function openContactDialog() {
    el.contactFeedback.textContent = '';
    if (typeof el.contactDialog.showModal === 'function') {
      if (!el.contactDialog.open) el.contactDialog.showModal();
    } else {
      el.contactDialog.setAttribute('open', '');
    }
  }

  function closeContactDialog() {
    if (typeof el.contactDialog.close === 'function' && el.contactDialog.open) {
      el.contactDialog.close();
    } else {
      el.contactDialog.removeAttribute('open');
    }
  }

  async function copySupportEmail() {
    const email = el.supportEmailText.textContent.trim();
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(email);
      } else {
        throw new Error('Clipboard API is unavailable');
      }
      el.contactFeedback.textContent = 'Email address copied. Paste it into your email app.';
      showToast('Support email copied to clipboard.');
    } catch (_) {
      // Fallback for browsers where Clipboard API is unavailable or denied.
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = email;
      temporaryInput.setAttribute('readonly', '');
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
      temporaryInput.remove();
      if (copied) {
        el.contactFeedback.textContent = 'Email address copied. Paste it into your email app.';
        showToast('Support email copied to clipboard.');
      } else {
        el.contactFeedback.textContent = 'Please select and copy the email address shown above.';
      }
    }
  }

  el.contactButton.addEventListener('click', openContactDialog);
  el.footerContactButton.addEventListener('click', openContactDialog);
  el.closeContactButton.addEventListener('click', closeContactDialog);
  el.copyEmailButton.addEventListener('click', copySupportEmail);
  el.contactDialog.addEventListener('click', (event) => {
    if (event.target === el.contactDialog) closeContactDialog();
  });

  // FAQ language toggle (English / Roman Urdu), fully client-side.
  const faqLanguageButtons = document.querySelectorAll('[data-faq-language]');
  const faqTextBlocks = document.querySelectorAll('[data-faq-text]');
  function setFaqLanguage(language) {
    faqTextBlocks.forEach((block) => {
      block.hidden = block.getAttribute('data-faq-text') !== language;
    });
    faqLanguageButtons.forEach((button) => {
      const active = button.getAttribute('data-faq-language') === language;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    const faqSection = document.getElementById('faq');
    if (faqSection) faqSection.setAttribute('lang', language === 'ur' ? 'ur-Latn' : 'en');
  }
  faqLanguageButtons.forEach((button) => {
    button.addEventListener('click', () => setFaqLanguage(button.getAttribute('data-faq-language')));
  });



  // Background remover: browser-only model inference, with no image upload endpoint.
  const bg = {
    fileInput: $('bgFileInput'), uploadButton: $('bgUploadButton'), uploadTitle: $('bgUploadTitle'), fileInfo: $('bgFileInfo'),
    removeButton: $('bgRemoveButton'), clearButton: $('bgClearButton'), status: $('bgStatus'), progressWrap: $('bgProgressWrap'),
    progressLabel: $('bgProgressLabel'), progressPercent: $('bgProgressPercent'), progress: $('bgProgress'),
    originalPreview: $('bgOriginalPreview'), originalEmpty: $('bgOriginalEmpty'), resultPreview: $('bgResultPreview'),
    resultEmpty: $('bgResultEmpty'), resultFrame: $('bgResultFrame'), exportControls: $('bgExportControls'),
    backgroundSelect: $('bgBackgroundSelect'), customColor: $('bgCustomColor'), downloadButton: $('bgDownloadButton')
  };
  const bgState = { file: null, originalUrl: null, resultUrl: null, resultBlob: null, busy: false, removeBackground: null };
  const BG_MAX_BYTES = 30 * 1024 * 1024;

  function bgSetStatus(message, kind = '') {
    bg.status.textContent = message;
    bg.status.classList.toggle('is-error', kind === 'error');
    bg.status.classList.toggle('is-success', kind === 'success');
  }

  function bgSetBusy(busy) {
    bgState.busy = busy;
    bg.removeButton.disabled = busy || !bgState.file;
    bg.uploadButton.disabled = busy;
    bg.clearButton.disabled = busy || !bgState.file;
    bg.removeButton.querySelector('span').textContent = busy ? 'Removing background…' : 'Remove background';
    bg.removeButton.setAttribute('aria-busy', String(busy));
  }

  function bgRevokePreviewUrls() {
    if (bgState.originalUrl) URL.revokeObjectURL(bgState.originalUrl);
    if (bgState.resultUrl) URL.revokeObjectURL(bgState.resultUrl);
    bgState.originalUrl = null;
    bgState.resultUrl = null;
  }

  function bgResetResult() {
    if (bgState.resultUrl) URL.revokeObjectURL(bgState.resultUrl);
    bgState.resultUrl = null;
    bgState.resultBlob = null;
    bg.resultPreview.removeAttribute('src');
    bg.resultPreview.hidden = true;
    bg.resultEmpty.hidden = false;
    bg.exportControls.hidden = true;
    bg.backgroundSelect.value = 'transparent';
    bg.customColor.hidden = true;
    bgUpdatePreviewBackground();
  }

  function bgChooseColor() {
    switch (bg.backgroundSelect.value) {
      case 'white': return '#ffffff';
      case 'blue': return '#0066cc';
      case 'custom': return bg.customColor.value;
      default: return null;
    }
  }

  function bgUpdatePreviewBackground() {
    const color = bgChooseColor();
    bg.resultFrame.classList.toggle('checkerboard', !color);
    bg.resultFrame.style.backgroundColor = color || '#ffffff';
    bg.customColor.hidden = bg.backgroundSelect.value !== 'custom';
  }

  async function bgLoadFile(file) {
    if (!file || bgState.busy) return;
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has((file.type || '').toLowerCase())) {
      bgSetStatus('Please choose a JPG, PNG or WebP image.', 'error');
      return;
    }
    if (!file.size || file.size > BG_MAX_BYTES) {
      bgSetStatus('Choose a non-empty image smaller than 30 MB for more reliable processing.', 'error');
      return;
    }
    bgRevokePreviewUrls();
    bgResetResult();
    bgState.file = file;
    bgState.originalUrl = URL.createObjectURL(file);
    bg.originalPreview.src = bgState.originalUrl;
    bg.originalPreview.hidden = false;
    bg.originalEmpty.hidden = true;
    bg.uploadTitle.textContent = 'Choose a different photo';
    bg.fileInfo.hidden = false;
    bg.fileInfo.textContent = `${file.name} · ${formatBytes(file.size)}`;
    bg.progressWrap.hidden = true;
    bg.progress.value = 0;
    bg.progressPercent.textContent = '0%';
    bgSetBusy(false);
    bgSetStatus('Photo ready. Select “Remove background” to begin.');
  }

  function bgUpdateProgress(event = {}) {
    const progress = Number.isFinite(event.progress) ? event.progress : 0;
    const percentage = Math.max(0, Math.min(100, Math.round(progress <= 1 ? progress * 100 : progress)));
    bg.progress.value = percentage;
    bg.progressPercent.textContent = `${percentage}%`;
    if (event.download && event.download.totalBytes > 0) {
      bg.progressLabel.textContent = `Downloading AI model: ${formatBytes(event.download.loadedBytes)} / ${formatBytes(event.download.totalBytes)}`;
    } else {
      bg.progressLabel.textContent = event.message || 'Processing in your browser…';
    }
    bgSetStatus(event.message || 'Processing in your browser…');
  }

  async function bgEnsureEngine() {
    if (bgState.removeBackground) return bgState.removeBackground;
    // The pinned browser package is served as static ESM. Model weights are fetched on demand;
    // there is no PixelFit backend and the selected image is passed only to the local model.
    const module = await import('https://esm.sh/@bg0/browser@0.1.2?bundle');
    if (typeof module.removeBackground !== 'function') {
      throw new Error('The background-removal engine did not load correctly. Refresh and try again.');
    }
    bgState.removeBackground = module.removeBackground;
    return bgState.removeBackground;
  }

  async function bgRemove() {
    if (!bgState.file || bgState.busy) return;
    bgSetBusy(true);
    bg.progressWrap.hidden = false;
    bg.progress.value = 2;
    bg.progressPercent.textContent = '2%';
    bg.progressLabel.textContent = 'Loading the browser-based AI engine…';
    bgSetStatus('Connecting to the public code/model CDN. Your photo is not uploaded.');
    try {
      const removeBackground = await bgEnsureEngine();
      bg.progressLabel.textContent = 'Preparing the lightweight AI model…';
      const result = await removeBackground(bgState.file, {
        model: 'lite',
        quality: 'quality',
        onProgress: bgUpdateProgress
      });
      if (!result || !(result.blob instanceof Blob) || result.blob.size === 0) {
        throw new Error('The background remover returned an empty result. Please try another photo.');
      }
      bgResetResult();
      bgState.resultBlob = result.blob;
      bgState.resultUrl = URL.createObjectURL(result.blob);
      bg.resultPreview.src = bgState.resultUrl;
      bg.resultPreview.hidden = false;
      bg.resultEmpty.hidden = true;
      bg.exportControls.hidden = false;
      bgUpdatePreviewBackground();
      bg.progress.value = 100;
      bg.progressPercent.textContent = '100%';
      bg.progressLabel.textContent = 'Background removed';
      bgSetStatus(`Done! Transparent PNG ready (${result.width} × ${result.height}).`, 'success');
      bg.downloadButton.focus({ preventScroll: true });
    } catch (error) {
      const rawMessage = error && typeof error.message === 'string' ? error.message : '';
      const message = /failed to fetch|network|load|import|module|fetch/i.test(rawMessage)
        ? 'Could not load the background-removal engine or model. Check your internet connection, refresh the page, and try again. Some browsers may not support this feature in the static version.'
        : (rawMessage || 'Background removal failed. Try a smaller JPG, PNG or WebP image.');
      bgSetStatus(message, 'error');
      bg.progressLabel.textContent = 'Could not complete';
    } finally {
      bgSetBusy(false);
    }
  }

  async function bgExport() {
    if (!bgState.resultBlob) return;
    bg.downloadButton.disabled = true;
    const originalLabel = bg.downloadButton.querySelector('span').textContent;
    bg.downloadButton.querySelector('span').textContent = 'Preparing PNG…';
    try {
      const fillColor = bgChooseColor();
      let exportBlob = bgState.resultBlob;
      if (fillColor) {
        const bitmap = await createImageBitmap(bgState.resultBlob);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Your browser could not create the export canvas.');
          context.fillStyle = fillColor;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(bitmap, 0, 0);
          exportBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not export the PNG.')), 'image/png');
          });
          canvas.width = 0;
          canvas.height = 0;
        } finally {
          bitmap.close?.();
        }
      }
      const downloadUrl = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      const filename = `${cleanBaseName(bgState.file?.name || 'image')}-pixelfit-no-background.png`;
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
      bgSetStatus(fillColor ? 'PNG downloaded with the selected background color.' : 'Transparent PNG downloaded successfully.', 'success');
    } catch (error) {
      bgSetStatus(error && error.message ? error.message : 'Could not prepare the download. Please try again.', 'error');
    } finally {
      bg.downloadButton.disabled = false;
      bg.downloadButton.querySelector('span').textContent = originalLabel;
    }
  }

  function bgClear() {
    if (bgState.busy) return;
    bgRevokePreviewUrls();
    bgState.file = null;
    bgResetResult();
    bg.fileInput.value = '';
    bg.originalPreview.removeAttribute('src');
    bg.originalPreview.hidden = true;
    bg.originalEmpty.hidden = false;
    bg.uploadTitle.textContent = 'Choose a photo';
    bg.fileInfo.textContent = '';
    bg.fileInfo.hidden = true;
    bg.progressWrap.hidden = true;
    bg.progress.value = 0;
    bgSetBusy(false);
    bgSetStatus('Choose a photo to start.');
  }

  bg.uploadButton.addEventListener('click', () => { if (!bgState.busy) bg.fileInput.click(); });
  bg.fileInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) bgLoadFile(file);
  });
  bg.removeButton.addEventListener('click', bgRemove);
  bg.clearButton.addEventListener('click', bgClear);
  bg.downloadButton.addEventListener('click', bgExport);
  bg.backgroundSelect.addEventListener('change', bgUpdatePreviewBackground);
  bg.customColor.addEventListener('input', bgUpdatePreviewBackground);
  ['dragenter', 'dragover'].forEach((eventName) => bg.uploadButton.addEventListener(eventName, (event) => {
    event.preventDefault();
    bg.uploadButton.classList.add('drag-over');
  }));
  ['dragleave', 'drop'].forEach((eventName) => bg.uploadButton.addEventListener(eventName, (event) => {
    event.preventDefault();
    bg.uploadButton.classList.remove('drag-over');
  }));
  bg.uploadButton.addEventListener('drop', (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) bgLoadFile(file);
  });
  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.getAttribute('data-scroll-target'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        bg.uploadButton.focus({ preventScroll: true });
      }
    });
  });


  $('year').textContent = new Date().getFullYear();
  updateQualityUi();
  updateFitHint();
  updateRatioLabel();
})();
