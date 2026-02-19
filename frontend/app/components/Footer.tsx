import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center">
      <p className="text-sm text-gray-500 italic">
        This application is limited to the maximum output of 512 tokens.
      </p>
    </footer>
  );
};

export default Footer;
