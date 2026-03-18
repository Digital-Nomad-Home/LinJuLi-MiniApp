'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ShoppingCart, Star, Shield, Truck, RotateCcw, Coins } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  longDescription: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  stock: number
  rating: number
  reviewCount: number
  features: string[]
  specifications: { [key: string]: string }
  tags: string[]
  isVirtual: boolean
}

interface UserBalance {
  tokens: number
  points: number
}

export default function ProductDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('id')
  
  const [product, setProduct] = useState<Product | null>(null)
  const [userBalance, setUserBalance] = useState<UserBalance>({ tokens: 0, points: 0 })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchUserBalance()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/store/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        toast.error('商品不存在')
        router.push('/store')
      }
    } catch (error) {
      toast.error('获取商品信息失败')
      router.push('/store')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user/balance')
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data)
      }
    } catch (error) {
      console.error('获取用户余额失败:', error)
    }
  }

  const handlePurchase = async () => {
    if (!product) return

    const totalCost = product.price * quantity
    if (userBalance.tokens < totalCost) {
      toast.error('积分余额不足')
      return
    }

    if (product.stock < quantity) {
      toast.error('库存不足')
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          totalCost,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('购买成功！')
        
        // 更新用户余额
        setUserBalance(prev => ({
          ...prev,
          tokens: prev.tokens - totalCost
        }))

        // 更新商品库存
        setProduct(prev => prev ? {
          ...prev,
          stock: prev.stock - quantity
        } : null)

        // 如果是虚拟商品，显示兑换信息
        if (product.isVirtual && result.redeemCode) {
          toast.success(`兑换码：${result.redeemCode}`, { duration: 10000 })
        }

        // 跳转到订单详情或订单列表
        router.push(`/profile/orders/${result.orderId}`)
      } else {
        const error = await response.json()
        toast.error(error.message || '购买失败')
      }
    } catch (error) {
      toast.error('购买失败，请稍后重试')
    } finally {
      setPurchasing(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">商品不存在</h1>
        <Button onClick={() => router.push('/store')}>返回商城</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 商品图片 */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            <Image
              src={product.images[selectedImage] || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 relative overflow-hidden rounded border-2 ${
                  selectedImage === index ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 商品信息 */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">{product.category}</Badge>
              {product.isVirtual && <Badge variant="secondary">虚拟商品</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewCount} 评价)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                库存: {product.stock}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-3xl font-bold text-primary">
                  {product.price}
                </span>
                <span className="text-sm text-muted-foreground">积分</span>
              </div>
              {product.originalPrice && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice}
                  </span>
                  <Badge variant="destructive">
                    省 {product.originalPrice - product.price}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>我的积分余额: {userBalance.tokens}</span>
            </div>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* 购买区域 */}
          <div className="space-y-4">
            {!product.isVirtual && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">数量:</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-16 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={handlePurchase}
                disabled={purchasing || product.stock < 1 || userBalance.tokens < product.price * quantity}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {purchasing ? '购买中...' : `立即购买 (${product.price * quantity} 积分)`}
              </Button>
            </div>

            {userBalance.tokens < product.price * quantity && (
              <p className="text-sm text-destructive">
                积分不足，还需要 {product.price * quantity - userBalance.tokens} 积分
              </p>
            )}

            {product.stock < 1 && (
              <p className="text-sm text-destructive">商品已售罄</p>
            )}
          </div>

          <Separator />

          {/* 保障信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>品质保证</span>
            </div>
            {!product.isVirtual && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>快速发货</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <RotateCcw className="w-4 h-4 text-purple-500" />
                  <span>7天退换</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="mt-12 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 商品详情 */}
          <Card>
            <CardHeader>
              <CardTitle>商品详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line">{product.longDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* 商品特性和规格 */}
          <div className="space-y-6">
            {product.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>商品特性</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {Object.keys(product.specifications).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>规格参数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm font-medium text-muted-foreground">{key}</span>
                        <span className="text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}