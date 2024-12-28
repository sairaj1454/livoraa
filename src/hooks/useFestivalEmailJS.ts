import emailjs from '@emailjs/browser';

interface EmailTemplate {
  subject: string;
  message: string;
}

const festivalTemplates: Record<string, EmailTemplate> = {
  newYear: {
    subject: "New Year, New Home - Exclusive 2025 Interior Design Offers!",
    message: `Dear [Customer Name],

Welcome to 2025! Start your year with a fresh perspective on your living space.

Transform your home into a haven of style and comfort with our New Year special packages:
• 25% off on complete home makeovers
• Complimentary 3D visualization for all projects
• Special New Year financing options with 0% interest
• Free interior design consultation worth ₹5,000

Book your consultation before January 15th to lock in these exclusive offers!

Here's to creating beautiful spaces together in 2025!

Best wishes,
Team Virtuous Interiors`
  },
  christmas: {
    subject: "Deck Your Halls with Virtuous Interiors - Christmas Special!",
    message: `Dear [Customer Name],

'Tis the season to make your home merry and bright! 

This Christmas, give your home the gift of elegance with our festive design packages:
• Special Christmas discounts up to 20% off
• Complimentary holiday decor consultation
• Exclusive winter home styling packages
• Fast-track renovation services for holiday readiness

Book before December 20th and receive a complimentary Christmas styling guide!

Wishing you a wonderful holiday season,
Team Virtuous Interiors`
  },
  diwali: {
    subject: "Illuminate Your Space this Diwali - Exclusive Interior Design Offers!",
    message: `Dear [Customer Name],

Wishing you a brilliant and prosperous Diwali! 

Transform your home into a masterpiece of light and luxury this festive season:

Premium Diwali Offers:
• 20% off on luxury interior packages
• Complimentary lighting design consultation
• Special festive EMI options starting at 0%
• Free 3D visualization for complete home projects
• Express renovation services for festival readiness

Book before [Festival Date] to avail these illuminating offers!

May your home shine as bright as your celebrations.

Best regards,
Team Virtuous Interiors`
  },
  holi: {
    subject: "Add Colors to Your Home this Holi with Virtuous Interiors! ",
    message: `Dear [Customer Name],

Happy Holi! 

As we celebrate this festival of colors, we invite you to bring vibrant new hues to your living space. Our color experts are ready to help you transform your home with the latest color trends and design innovations.

Holi Special Offers:
• Complimentary color consultation
• 20% off on painting services
• Special discounts on colorful home decor items

Let's make your home as colorful as this festive season!

Best wishes,
Team Virtuous Interiors`
  },
  dussehra: {
    subject: "Celebrate New Beginnings with Virtuous Interiors this Dussehra! ",
    message: `Dear [Customer Name],

Happy Dussehra! 

As we celebrate the triumph of good over evil, it's the perfect time for new beginnings. Give your home a fresh start with our special Dussehra renovation packages.

Dussehra Special Offers:
• Free home assessment
• Special discounts on renovation packages
• Exclusive festive season warranties

Start your home transformation journey with us today!

Warm regards,
Team Virtuous Interiors`
  },
  ganeshChaturthi: {
    subject: "Welcome Lord Ganesha to a Beautiful Home! ",
    message: `Dear [Customer Name],

Ganpati Bappa Morya! 

Make this Ganesh Chaturthi special by welcoming Lord Ganesha to a beautifully designed home. Our experts can help you create the perfect space for your festivities.

Festival Special Offers:
• Special packages for Pooja room design
• Discounts on home organization solutions
• Quick renovation services

Let's create a divine space for your celebrations!

Regards,
Team Virtuous Interiors`
  },
  sankranti: {
    subject: "Celebrate Sankranti with a Home Makeover - Special Offers!",
    message: `Dear [Customer Name],

Happy Sankranti! As we celebrate this harvest festival, let's bring prosperity and beauty to your home.

Our Sankranti Special Offerings:
• 15% off on traditional interior designs
• Special packages for kitchen renovations
• Complimentary vastu consultation
• Exclusive discounts on custom furniture

Book your consultation today to create a space that reflects both tradition and modern elegance.

Warm regards,
Team Virtuous Interiors`
  },
  valentines: {
    subject: "Love Where You Live - Valentine's Special Interior Offers!",
    message: `Dear [Customer Name],

This Valentine's Day, fall in love with your home all over again!

Special Couple's Offers:
• Exclusive couples' consultation sessions
• 20% off on bedroom makeovers
• Special packages for newlywed homes
• Complimentary mood board creation
• Romantic lighting design services

Book before February 14th to transform your space into a romantic haven.

With love,
Team Virtuous Interiors`
  }
};

interface SendFestivalEmailParams {
  to: string;
  toName: string;
  subject: string;
  message: string;
}

export const useFestivalEmailJS = () => {
  const sendFestivalEmail = async ({ to, toName, subject, message }: SendFestivalEmailParams) => {
    try {
      const response = await emailjs.send(
        'service_z7kagc4',  
        'template_38nrv0k', 
        {
          to_email: to,
          to_name: toName,
          subject: subject,
          message: message
        },
        'wGzsvi5X7v8prOba-'  
      );
      return response;
    } catch (error) {
      console.error('Error sending festival email:', error);
      throw error;
    }
  };

  const getFestivalTemplate = (festival: keyof typeof festivalTemplates): EmailTemplate => {
    return festivalTemplates[festival];
  };

  const getAvailableTemplates = () => {
    return Object.keys(festivalTemplates);
  };

  return {
    sendFestivalEmail,
    getFestivalTemplate,
    getAvailableTemplates,
    festivalTemplates
  };
};
