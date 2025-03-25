// pages/remove-bg/index.js
const API_KEY = '6HjqPvQ5kxrzK7QPPNRj6FLC';
const API_URL = 'https://api.remove.bg/v1.0/removebg';

Page({

  /**
   * Page initial data
   */
  data: {
    tempImagePath: '',
    resultImagePath: '',
    isProcessing: false
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
        this.setData({
          tempImagePath: res.tempFiles[0].tempFilePath,
          resultImagePath: ''
        });
      }
    });
  },

  // 去除背景
  removeBg() {
    if (!this.data.tempImagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    // 使用uploadFile发送请求
    wx.uploadFile({
      url: API_URL,
      filePath: this.data.tempImagePath,
      name: 'image_file',
      header: {
        'X-Api-Key': API_KEY
      },
      formData: {
        size: 'auto'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 将返回的图片数据保存为临时文件
          const fs = wx.getFileSystemManager();
          const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.png`;
          
          try {
            fs.writeFileSync(
              tempFilePath,
              res.data,
              'binary'
            );

            this.setData({
              resultImagePath: tempFilePath
            });

            wx.showToast({
              title: '处理成功',
              icon: 'success'
            });
          } catch (err) {
            console.error('保存文件失败：', err);
            wx.showToast({
              title: '处理失败',
              icon: 'none'
            });
          }
        } else {
          console.error('API请求失败：', res);
          wx.showToast({
            title: '处理失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('去除背景失败：', err);
        wx.showToast({
          title: '处理失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isProcessing: false });
      }
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.resultImagePath) {
      wx.showToast({
        title: '请先处理图片',
        icon: 'none'
      });
      return;
    }

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
      filePath: this.data.resultImagePath,
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
      resultImagePath: '',
      isProcessing: false
    });
  }
})