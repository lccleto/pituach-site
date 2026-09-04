<?php
// contact.php - simples handler para Hostinger (envia para dois emails)
if($_SERVER['REQUEST_METHOD'] === 'POST'){
  $name = strip_tags($_POST['name'] ?? '');
  $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
  $phone = strip_tags($_POST['phone'] ?? '');
  $service = strip_tags($_POST['service'] ?? '');
  $message = strip_tags($_POST['message'] ?? '');

  if(!$name || !$email || !$message){
    http_response_code(400);
    echo 'Por favor preencha os campos obrigatórios.';
    exit;
  }

  // destinatários
  $to = 'contato@pituach.dev.br, pituach.dev@gmail.com'; // duplicado conforme solicitado
  $subject = "Contato do site Pituach: $service";
  $body = "Nome: $name\nEmail: $email\nTelefone: $phone\nServico: $service\n\nMensagem:\n$message\n";
  $headers = "From: $name <$email>\r\nReply-To: $email\r\n";

  $sent = mail($to, $subject, $body, $headers);
  if($sent){
    header('Location: /contact.html?sent=1');
    exit;
  } else {
    http_response_code(500);
    echo 'Erro ao enviar a mensagem. Entre em contato pelo WhatsApp.';
  }
}
?>
