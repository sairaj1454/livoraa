import emailjs from '@emailjs/browser';

// EmailJS credentials
const SERVICE_ID = 'service_z7kagc4';
const TEMPLATE_ID = 'template_xvd585o';
const PUBLIC_KEY = 'wGzsvi5X7v8prOba-';

interface EmailData {
  to?: string;
  subject?: string;
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  formType?: string;
}

export const useEmailNotification = () => {
  const sendEmail = async (data: EmailData) => {
    try {
      // Format the message based on whether it's a campaign or form submission
      const formattedMessage = data.formType
        ? `
New Enquiry from ${data.formType.toUpperCase()} Form

Customer Details:
----------------
Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email || 'Not provided'}

Message:
--------
${data.message}

Form Details:
------------
Form Type: ${data.formType}
Submission Time: ${new Date().toLocaleString()}
`
        : data.message;

      const templateParams = {
        to_email: data.to || 'ecnodev@gmail.com',
        subject: data.subject || `New ${data.formType} Enquiry`,
        from_name: data.name || 'LIVORAA ATELIER',
        from_email: data.email || 'noreply@LIVORAA ATELIER.com',
        phone: data.phone || '',
        message: formattedMessage,
        form_type: data.formType || 'campaign',
      };

      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );

      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  };

  return { sendEmail };
};
