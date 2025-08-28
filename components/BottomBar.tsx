interface BottomBarProps {
  user: string;
  description: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ user, description }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full text-white p-4 z-10 bg-gradient-to-t from-black/50 to-transparent">
      <h3 className="font-bold text-lg">@{user}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default BottomBar;
