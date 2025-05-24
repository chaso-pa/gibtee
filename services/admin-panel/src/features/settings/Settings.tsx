// src/features/settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SystemSettings {
  id: number;
  isOrderAcceptanceEnabled: boolean;
  orderSuspensionMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isOrderAcceptanceEnabled, setIsOrderAcceptanceEnabled] = useState(true);
  const [orderSuspensionMessage, setOrderSuspensionMessage] = useState('');

  // 設定を取得
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setIsOrderAcceptanceEnabled(data.isOrderAcceptanceEnabled);
        setOrderSuspensionMessage(data.orderSuspensionMessage || '');
      } else {
        setMessage({ type: 'error', text: '設定の取得に失敗しました' });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: '設定の取得中にエラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  // 設定を保存
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isOrderAcceptanceEnabled,
          orderSuspensionMessage: orderSuspensionMessage.trim() || null,
        }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: '設定を保存しました' });
        
        // 3秒後にメッセージを消す
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: '設定の保存に失敗しました' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: '設定の保存中にエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">設定を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">システム設定</h1>
        <p className="text-muted-foreground">サービスの基本設定を管理します</p>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>注文受付設定</CardTitle>
          <CardDescription>
            新規注文の受付を一時的に停止することができます。メンテナンス時やサービス停止時にご利用ください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="order-acceptance"
              checked={isOrderAcceptanceEnabled}
              onCheckedChange={setIsOrderAcceptanceEnabled}
            />
            <Label htmlFor="order-acceptance" className="text-sm font-medium">
              新規注文を受け付ける
            </Label>
          </div>

          {!isOrderAcceptanceEnabled && (
            <div className="space-y-2">
              <Label htmlFor="suspension-message" className="text-sm font-medium">
                受付停止時のメッセージ
              </Label>
              <Textarea
                id="suspension-message"
                placeholder="現在サービスを一時停止しております。ご迷惑をおかけして申し訳ございません。"
                value={orderSuspensionMessage}
                onChange={(e) => setOrderSuspensionMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {orderSuspensionMessage.length}/500文字 - 注文受付停止時にユーザーに表示されるメッセージです
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  設定を保存
                </>
              )}
            </Button>
          </div>

          {!isOrderAcceptanceEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>注意:</strong> 現在、新規注文の受付が停止されています。
                ユーザーがLINEボットで注文を開始しようとした際に、設定したメッセージが表示されます。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>設定情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">最終更新:</span>{' '}
                {new Date(settings.updatedAt).toLocaleString('ja-JP')}
              </div>
              <div>
                <span className="font-medium">作成日時:</span>{' '}
                {new Date(settings.createdAt).toLocaleString('ja-JP')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
