interface DeviceCardProps {
  image: string;
  name: string;
  category: string;
  status: string;
  specs?: string;
  buttonText?: string;
  buttonDisabled?: boolean;
  onButtonClick?: () => void;
}

function DeviceCard({
  image,
  name,
  category,
  status,
  specs,
  buttonText = 'Loan Device',
  buttonDisabled = false,
  onButtonClick
}: DeviceCardProps) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-500">{category}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'Available' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        </div>
        {specs && <p className="text-sm text-gray-600 mb-4">{specs}</p>}
        <button 
          disabled={buttonDisabled}
          onClick={onButtonClick}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            buttonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default DeviceCard;
