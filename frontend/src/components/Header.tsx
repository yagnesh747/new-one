import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="header">
      <span className="header-title">{title}</span>
    </header>
  );
};

export default Header;
