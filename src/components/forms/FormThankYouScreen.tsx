import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormThankYouScreenProps {
  title: string;
  message: string;
  enterEmailText: string;
  sendEmailText: string;
  downloadPDFText: string;
  finishText: string;
  sendingText: string;
  generatingText: string;
  emailSentText: string;
  emailErrorText: string;
  invalidEmailText: string;
  onDownloadPDF: () => Promise<void>;
  onSendEmail?: (email: string) => Promise<void>;
  onFinish: () => void;
  isRTL?: boolean;
}

export const FormThankYouScreen: React.FC<FormThankYouScreenProps> = ({
  title,
  message,
  enterEmailText,
  sendEmailText,
  downloadPDFText,
  finishText,
  sendingText,
  generatingText,
  emailSentText,
  emailErrorText,
  invalidEmailText,
  onDownloadPDF,
  onSendEmail,
  onFinish,
  isRTL = true,
}) => {
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await onDownloadPDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error(invalidEmailText);
      return;
    }

    if (!onSendEmail) {
      toast.info('Email sending not configured');
      return;
    }

    setIsSendingEmail(true);
    try {
      await onSendEmail(email);
      toast.success(emailSentText);
    } catch (error) {
      toast.error(emailErrorText);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">{title}</CardTitle>
          <p className="text-muted-foreground mt-2">{message}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Download PDF Button */}
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full gap-2"
            size="lg"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {generatingText}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {downloadPDFText}
              </>
            )}
          </Button>

          {/* Email Section */}
          {onSendEmail && (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={enterEmailText}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
                dir="ltr"
              />
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !email}
                variant="outline"
                className="w-full gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {sendingText}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    {sendEmailText}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Finish Button */}
          <Button
            onClick={onFinish}
            variant="ghost"
            className="w-full mt-4"
          >
            {finishText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
