import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, ArrowUpDown, Clock, CheckCircle } from 'lucide-react';

interface TradePost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  type: 'buy' | 'sell';
  tokenOffered: string;
  tokenWanted: string;
  amountOffered: number;
  amountWanted: number;
  rate: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  description?: string;
}

export default function TokenExchangePage() {
  const [tradePosts, setTradePosts] = useState<TradePost[]>([
    {
      id: '1',
      user: { id: 'user1', name: '李思颖', avatar: '/avatars/li.jpg' },
      type: 'buy',
      tokenOffered: 'USDT',
      tokenWanted: 'DNP',
      amountOffered: 100,
      amountWanted: 300,
      rate: 3,
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      description: '回购DNP代币，长期有效'
    },
    {
      id: '2',
      user: { id: 'user2', name: '王小明', avatar: '/avatars/wang.jpg' },
      type: 'sell',
      tokenOffered: 'DNP',
      tokenWanted: 'BTC',
      amountOffered: 150,
      amountWanted: 0.001,
      rate: 0.00000667,
      status: 'active',
      createdAt: '2024-01-14T15:30:00Z'
    }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'sell' as 'buy' | 'sell',
    tokenOffered: '',
    tokenWanted: '',
    amountOffered: '',
    amountWanted: '',
    description: ''
  });

  const tokens = ['DNP', 'USDT', 'BTC', 'ETH', 'USDC'];

  const handleCreatePost = () => {
    if (!newPost.tokenOffered || !newPost.tokenWanted || !newPost.amountOffered || !newPost.amountWanted) {
      toast({
        title: '请填写完整信息',
        description: '所有必填字段都需要填写',
        variant: 'destructive'
      });
      return;
    }

    if (newPost.tokenOffered === newPost.tokenWanted) {
      toast({
        title: '代币类型错误',
        description: '提供代币和需求代币不能相同',
        variant: 'destructive'
      });
      return;
    }

    const post: TradePost = {
      id: Date.now().toString(),
      user: { id: 'current_user', name: '当前用户', avatar: '/avatars/current.jpg' },
      type: newPost.type,
      tokenOffered: newPost.tokenOffered,
      tokenWanted: newPost.tokenWanted,
      amountOffered: parseFloat(newPost.amountOffered),
      amountWanted: parseFloat(newPost.amountWanted),
      rate: parseFloat(newPost.amountWanted) / parseFloat(newPost.amountOffered),
      status: 'active',
      createdAt: new Date().toISOString(),
      description: newPost.description
    };

    setTradePosts(prev => [post, ...prev]);
    setNewPost({
      type: 'sell',
      tokenOffered: '',
      tokenWanted: '',
      amountOffered: '',
      amountWanted: '',
      description: ''
    });
    setIsCreating(false);
    
    toast({
      title: '交易帖发布成功',
      description: '您的交易帖已发布，等待其他用户成交'
    });
  };

  const handleDeal = async (postId: string) => {
    const post = tradePosts.find(p => p.id === postId);
    if (!post) return;

    try {
      // 模拟自动转账逻辑
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTradePosts(prev => prev.map(p => 
        p.id === postId ? { ...p, status: 'completed' } : p
      ));
      
      toast({
        title: '交易成功',
        description: `已完成 ${post.amountOffered} ${post.tokenOffered} → ${post.amountWanted} ${post.tokenWanted} 的交易`
      });
    } catch (error) {
      toast({
        title: '交易失败',
        description: '代币转账失败，请检查余额或稍后重试',
        variant: 'destructive'
      });
    }
  };

  const activePosts = tradePosts.filter(post => post.status === 'active');
  const myPosts = tradePosts.filter(post => post.user.id === 'current_user');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">代币交易所</h1>
          <p className="text-muted-foreground mt-2">安全便捷的代币交换平台</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          发布交易
        </Button>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="market">交易市场</TabsTrigger>
          <TabsTrigger value="my-posts">我的交易</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-6">
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>发布新交易</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>交易类型</Label>
                    <Select value={newPost.type} onValueChange={(value: 'buy' | 'sell') => setNewPost(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">出售代币</SelectItem>
                        <SelectItem value="buy">收购代币</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>提供代币</Label>
                    <Select value={newPost.tokenOffered} onValueChange={(value) => setNewPost(prev => ({ ...prev, tokenOffered: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择代币" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map(token => (
                          <SelectItem key={token} value={token}>{token}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>提供数量</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={newPost.amountOffered}
                      onChange={(e) => setNewPost(prev => ({ ...prev, amountOffered: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>需求代币</Label>
                    <Select value={newPost.tokenWanted} onValueChange={(value) => setNewPost(prev => ({ ...prev, tokenWanted: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择代币" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map(token => (
                          <SelectItem key={token} value={token}>{token}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>需求数量</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={newPost.amountWanted}
                      onChange={(e) => setNewPost(prev => ({ ...prev, amountWanted: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>备注说明（可选）</Label>
                  <Input 
                    placeholder="添加交易说明..."
                    value={newPost.description}
                    onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreatePost}>发布交易</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>取消</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {activePosts.map(post => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={post.user.avatar} />
                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{post.user.name}</h3>
                          <Badge variant={post.type === 'buy' ? 'default' : 'secondary'}>
                            {post.type === 'buy' ? '收购' : '出售'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <span>{post.amountOffered} {post.tokenOffered}</span>
                        <ArrowUpDown className="w-4 h-4" />
                        <span>{post.amountWanted} {post.tokenWanted}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        汇率: 1 {post.tokenOffered} = {post.rate.toFixed(6)} {post.tokenWanted}
                      </p>
                    </div>
                    
                    {post.user.id !== 'current_user' && (
                      <Button onClick={() => handleDeal(post.id)} className="ml-4">
                        立即成交
                      </Button>
                    )}
                  </div>
                  
                  {post.description && (
                    <p className="mt-4 text-sm text-muted-foreground">{post.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {activePosts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">暂无活跃交易</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-posts" className="space-y-4">
          {myPosts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={post.type === 'buy' ? 'default' : 'secondary'}>
                        {post.type === 'buy' ? '收购' : '出售'}
                      </Badge>
                      <Badge variant={
                        post.status === 'active' ? 'outline' : 
                        post.status === 'completed' ? 'default' : 'destructive'
                      }>
                        {post.status === 'active' && <><Clock className="w-3 h-3 mr-1" />进行中</>}
                        {post.status === 'completed' && <><CheckCircle className="w-3 h-3 mr-1" />已完成</>}
                        {post.status === 'cancelled' && '已取消'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span>{post.amountOffered} {post.tokenOffered}</span>
                      <ArrowUpDown className="w-4 h-4" />
                      <span>{post.amountWanted} {post.tokenWanted}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      发布时间: {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {post.status === 'active' && (
                    <Button variant="outline" size="sm">
                      取消交易
                    </Button>
                  )}
                </div>
                
                {post.description && (
                  <p className="mt-4 text-sm text-muted-foreground">{post.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
          
          {myPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">您还没有发布任何交易</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}