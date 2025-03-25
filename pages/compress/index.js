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
        
        // 根据图片大小设置合适的压缩比例范围
        let maxRatio = 90;
        const sizeInMB = size / (1024 * 1024);
        
        if (sizeInMB > 2) {
          maxRatio = 70;
        } else if (sizeInMB > 1) {
          maxRatio = 80;
        }
        
        this.setData({
          tempImagePath: tempFilePath,
          originalSize: (size / 1024).toFixed(2),
          compressedImagePath: '',
          compressionRatio: Math.min(this.data.compressionRatio, maxRatio)
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
    wx.showLoading({
      title: '压缩中...'
    });
    
    wx.compressImage({
      src: this.data.tempImagePath,
      quality: quality * 100,
      success: (res) => {
        // 获取压缩后的文件大小
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (fileInfo) => {
            const compressedSize = (fileInfo.size / 1024).toFixed(2);
            const originalSizeKB = parseFloat(this.data.originalSize);
            const compressedSizeKB = parseFloat(compressedSize);
            const compressionRate = ((originalSizeKB - compressedSizeKB) / originalSizeKB * 100).toFixed(2);
            
            this.setData({
              compressedImagePath: res.tempFilePath,
              compressedSize: compressedSize,
              compressionRate: compressionRate
            });

            wx.showToast({
              title: '压缩成功',
              icon: 'success'
            });
          }
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '压缩失败',
          icon: 'none'
        });
        console.error('压缩失败：', err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 保存图片
  saveImage() {
    // 检查是否有保存到相册的权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 没有权限，向用户发起授权请求
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.saveImageToAlbum();
            },
            fail: () => {
              // 用户拒绝授权，引导用户去设置页面开启权限
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                          this.saveImageToAlbum();
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          // 已有权限，直接保存
          this.saveImageToAlbum();
        }
      }
    });
  },

  // 实际保存图片到相册的方法
  saveImageToAlbum() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        console.error('保存失败：', err);
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