# Bài 62 — Email provider cho production

Development tiếp tục dùng pickup directory để học và test không cần gửi mail thật. Production giờ có thể dùng SMTP bằng các biến cấu hình:

```text
PublicOrigin=https://tv.example.com
Smtp__Host=smtp.example.com
Smtp__Port=587
Smtp__Username=...
Smtp__Password=...
Smtp__From=no-reply@tv.example.com
```

`SmtpEmailSender` dùng chung cho password reset và email confirmation. Secret chỉ đi qua environment variable hoặc secret store, không ghi vào repository. Nếu production chưa có `Smtp:Host`, ứng dụng vẫn đăng ký sender unavailable và log lỗi delivery thay vì giả vờ gửi thành công.

`PublicOrigin` rất quan trọng: link trong email phải trỏ tới frontend public, không phải địa chỉ localhost. SMTP provider thực tế còn cần SPF/DKIM/DMARC, giới hạn gửi và monitoring; bài này chỉ hoàn thiện adapter gửi cơ bản.
