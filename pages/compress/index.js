// pages/compress/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    tempImagePath: '',
    compressedImagePath: '',
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 80,
    compressionRate: 0
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const size = res.tempFiles[0].size;
        
        this.setData({
          tempImagePath: tempFilePath,
          originalSize: (size / 1024).toFixed(2),
          compressedImagePath: ''
        });
      }
    });
  },

  // 滑块改变
  onSliderChange(e) {
    this.setData({
      compressionRatio: e.detail.value
    });
  },

  // 压缩图片
  compressImage() {
    const quality = this.data.compressionRatio / 100;
    
    wx.compressImage({
      src: this.data.tempImagePath,
      quality: quality * 100,
      success: (res) => {
        // 获取压缩后的文件大小
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (fileInfo) => {
            const compressedSize = (fileInfo.size / 1024).toFixed(2);
            const compressionRate = ((1 - (fileInfo.size / (this.data.originalSize * 1024))) * 100).toFixed(2);
            
            this.setData({
              compressedImagePath: res.tempFilePath,
              compressedSize: compressedSize,
              compressionRate: compressionRate
            });
          }
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '压缩失败',
          icon: 'none'
        });
      }
    });
  },

  // 保存图片
  saveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  // 重新选择
  resetImage() {
    this.setData({
      tempImagePath: '',
      compressedImagePath: '',
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 80,
      compressionRate: 0
    });
  }
})