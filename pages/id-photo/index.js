// pages/id-photo/index.js
const app = getApp()

Page({

  /**
   * Page initial data
   */
  data: {
    currentStep: 1,
    selectedSize: '', // 选中的尺寸
    selectedColor: '', // 选中的背景色
    tempImagePath: '', // 临时图片路径
    resultImagePath: '', // 结果图片路径
    isProcessing: false, // 是否正在处理
    processStep: '', // 处理进度提示
    photoSizes: {
      '1': { width: 295, height: 413, name: '一寸' },
      '2': { width: 413, height: 626, name: '二寸' },
      '3': { width: 390, height: 567, name: '小二寸' }
    },
    bgColors: {
      'white': '#FFFFFF',
      'blue': '#438EDB',
      'red': '#FF0000'
    }
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

  // 步骤控制方法
  nextStep() {
    const { currentStep, selectedSize, selectedColor } = this.data;
    
    // 验证当前步骤是否可以进入下一步
    if (currentStep === 1 && !selectedSize) return;
    if (currentStep === 2 && !selectedColor) return;
    
    if (currentStep < 3) {
      this.setData({
        currentStep: currentStep + 1
      });
    }
  },

  prevStep() {
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setData({
        currentStep: currentStep - 1
      });
    }
  },

  // 选择尺寸
  selectSize(e) {
    const size = e.currentTarget.dataset.size
    this.setData({
      selectedSize: size
    })
  },

  // 选择背景色
  selectColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({
      selectedColor: color
    })
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
          resultImagePath: '' // 清空之前的结果
        })
      }
    })
  },

  // 重置流程
  resetProcess() {
    this.setData({
      currentStep: 1,
      selectedSize: '',
      selectedColor: '',
      tempImagePath: '',
      isProcessing: false,
      processStep: '',
      resultImagePath: ''
    });
  },

  // 重试
  retryProcess() {
    this.resetProcess();
  },

  // 更新处理进度
  updateProcessStep(step) {
    this.setData({
      processStep: step
    })
    console.log('当前步骤:', step)
  },

  // 处理图片
  async processImage() {
    if (!this.data.tempImagePath || this.data.isProcessing) return;

    this.setData({
      isProcessing: true,
      processStep: '正在处理图片...'
    });

    try {
      // 1. 调用 remove.bg API 抠图
      this.updateProcessStep('正在抠图...')
      const removeBgResult = await this.removeBackground(this.data.tempImagePath)
      console.log('抠图完成:', removeBgResult)
      
      // 2. 根据选择的尺寸裁剪图片
      this.updateProcessStep('正在裁剪图片...')
      const cropResult = await this.cropImage(removeBgResult)
      console.log('裁剪完成:', cropResult)
      
      // 3. 合成最终证件照
      this.updateProcessStep('正在合成证件照...')
      const finalResult = await this.composeImage(cropResult)
      console.log('合成完成:', finalResult)
      
      // 4. 更新界面
      this.setData({
        resultImagePath: finalResult,
        isProcessing: false,
        processStep: ''
      }, () => {
        // 确保结果已经设置后再显示提示
        wx.showToast({
          title: '处理完成',
          icon: 'success'
        })
      })
    } catch (error) {
      console.error('处理图片失败:', error)
      this.setData({
        isProcessing: false,
        processStep: ''
      }, () => {
        wx.showToast({
          title: error.message || '处理失败，请重试',
          icon: 'none',
          duration: 2000
        })
      })
    }
  },

  // 调用 remove.bg API 抠图
  async removeBackground(imagePath) {
    return new Promise((resolve, reject) => {
      // 检查 API 密钥
      if (!app.globalData.removeBgApiKey) {
        reject(new Error('未配置 Remove.bg API 密钥'))
        return
      }

      // 先读取文件内容
      wx.getFileSystemManager().readFile({
        filePath: imagePath,
        success: (res) => {
          // 将文件内容转换为 base64
          const base64Data = wx.arrayBufferToBase64(res.data)
          
          // 调用 remove.bg API
          wx.request({
            url: 'https://api.remove.bg/v1.0/removebg',
            method: 'POST',
            header: {
              'X-Api-Key': app.globalData.removeBgApiKey,
              'Content-Type': 'application/json'
            },
            data: {
              image_file_b64: base64Data,
              size: 'auto',
              format: 'png'
            },
            responseType: 'arraybuffer',
            success: (res) => {
              if (res.statusCode === 200) {
                // 直接使用返回的二进制数据
                const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_remove_bg.png`
                wx.getFileSystemManager().writeFile({
                  filePath: tempFilePath,
                  data: res.data,
                  encoding: 'binary',
                  success: () => {
                    console.log('抠图结果已保存:', tempFilePath)
                    resolve(tempFilePath)
                  },
                  fail: (err) => {
                    console.error('保存抠图结果失败:', err)
                    reject(new Error('保存文件失败: ' + err.errMsg))
                  }
                })
              } else {
                reject(new Error(`API 调用失败: ${res.statusCode}`))
              }
            },
            fail: (err) => {
              console.error('API 请求失败:', err)
              reject(new Error('API 请求失败: ' + err.errMsg))
            }
          })
        },
        fail: (err) => {
          console.error('读取文件失败:', err)
          reject(new Error('读取文件失败: ' + err.errMsg))
        }
      })
    })
  },

  // 裁剪图片
  async cropImage(imagePath) {
    return new Promise((resolve, reject) => {
      const size = this.data.photoSizes[this.data.selectedSize]
      
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: async (imageInfo) => {
          try {
            // 创建 canvas 上下文
            const query = wx.createSelectorQuery()
            const canvasRes = await new Promise((resolve, reject) => {
              query.select('#cropCanvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                  if (res[0] && res[0].node) {
                    resolve(res[0])
                  } else {
                    reject(new Error('获取 canvas 节点失败'))
                  }
                })
            })

            const canvas = canvasRes.node
            const ctx = canvas.getContext('2d')

            // 设置 canvas 尺寸
            const canvasWidth = size.width * 10
            const canvasHeight = size.height * 10
            canvas.width = canvasWidth
            canvas.height = canvasHeight

            // 创建图片对象
            const img = canvas.createImage()
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = imagePath
            })

            // 计算绘制参数
            const scale = Math.min(
              canvasWidth / imageInfo.width,
              canvasHeight / imageInfo.height
            )
            const drawWidth = imageInfo.width * scale
            const drawHeight = imageInfo.height * scale
            const x = (canvasWidth - drawWidth) / 2
            const y = (canvasHeight - drawHeight) / 2

            // 清空画布并绘制图片
            ctx.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx.drawImage(img, x, y, drawWidth, drawHeight)

            // 导出图片
            const result = await new Promise((resolve, reject) => {
              wx.canvasToTempFilePath({
                canvas: canvas,
                success: res => resolve(res.tempFilePath),
                fail: err => reject(new Error('导出图片失败: ' + err.errMsg))
              })
            })

            resolve(result)
          } catch (err) {
            console.error('裁剪图片失败:', err)
            reject(err)
          }
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err)
          reject(new Error('获取图片信息失败: ' + err.errMsg))
        }
      })
    })
  },

  // 合成最终证件照
  async composeImage(imagePath) {
    return new Promise((resolve, reject) => {
      const size = this.data.photoSizes[this.data.selectedSize]
      const bgColor = this.data.bgColors[this.data.selectedColor]

      // 创建 canvas 上下文
      const query = wx.createSelectorQuery()
      query.select('#composeCanvas')
        .fields({ node: true, size: true })
        .exec(async (res) => {
          try {
            if (!res[0] || !res[0].node) {
              throw new Error('获取 canvas 节点失败')
            }

            const canvas = res[0].node
            const ctx = canvas.getContext('2d')

            // 设置 canvas 尺寸
            const canvasWidth = size.width * 10
            const canvasHeight = size.height * 10
            canvas.width = canvasWidth
            canvas.height = canvasHeight

            // 绘制背景色
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)

            // 创建图片对象
            const img = canvas.createImage()
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = imagePath
            })

            // 绘制图片
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

            // 导出图片
            const result = await new Promise((resolve, reject) => {
              wx.canvasToTempFilePath({
                canvas: canvas,
                success: res => resolve(res.tempFilePath),
                fail: err => reject(new Error('导出图片失败: ' + err.errMsg))
              })
            })

            resolve(result)
          } catch (err) {
            console.error('合成证件照失败:', err)
            reject(err)
          }
        })
    })
  },

  // 保存图片到相册
  saveImage() {
    if (!this.data.resultImagePath) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      })
      return
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('保存失败:', err)
        wx.showToast({
          title: '保存失败，请检查相册权限',
          icon: 'none'
        })
      }
    })
  }
})