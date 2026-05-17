import { useState } from 'react';
import { getCountryCallingCode, getCountries } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

interface PhoneInputComponentProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    onBlur?: () => void;
    hasError?: boolean;
}

const PhoneInputComponent = ({ 
    value, 
    onChange, 
    className = '', 
    onBlur,
    hasError = false 
}: PhoneInputComponentProps) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Mapeo de países con la longitud máxima de sus números telefónicos
    const getPhoneLengthForCountry = (country: string): number => {
        const phoneLengths: Record<string, number> = {
            'CR': 8,  // Costa Rica
            'US': 10, // Estados Unidos
            'CA': 10, // Canadá
            'MX': 10, // México
            'GT': 8,  // Guatemala
            'HN': 8,  // Honduras
            'SV': 8,  // El Salvador
            'NI': 8,  // Nicaragua
            'PA': 8,  // Panamá
            'ES': 9,  // España
            'AR': 10, // Argentina
            'CO': 10, // Colombia
            'CL': 9,  // Chile
            'PE': 9,  // Perú
            'VE': 10, // Venezuela
            'EC': 9,  // Ecuador
            'BO': 8,  // Bolivia
            'PY': 9,  // Paraguay
            'UY': 8,  // Uruguay
            'BR': 11, // Brasil
            'GB': 10, // Reino Unido
            'FR': 9,  // Francia
            'DE': 10, // Alemania
            'IT': 10, // Italia
            'PT': 9,  // Portugal
            'CN': 11, // China
            'JP': 10, // Japón
            'KR': 10, // Corea del Sur
            'IN': 10, // India
            'AU': 9,  // Australia
            'NZ': 9,  // Nueva Zelanda
        };
        return phoneLengths[country] || 15; // Default 15 si no está en el mapeo
    };

    // Extraer el código de país del valor actual
    const getCountryFromValue = (phoneValue: string): string => {
        if (!phoneValue || !phoneValue.startsWith('+')) return 'CR';
        
        const countries = getCountries();
        for (const country of countries) {
            const callingCode = getCountryCallingCode(country);
            if (phoneValue.startsWith(`+${callingCode}`)) {
                return country;
            }
        }
        return 'CR';
    };

    const getPhoneNumberWithoutCountryCode = (phoneValue: string, country: string): string => {
        if (!phoneValue || !phoneValue.startsWith('+')) return '';
        try {
            const callingCode = getCountryCallingCode(country as any);
            return phoneValue.replace(`+${callingCode}`, '').trim();
        } catch {
            return '';
        }
    };

    const [selectedCountry, setSelectedCountry] = useState<string>(getCountryFromValue(value));
    const [phoneNumber, setPhoneNumber] = useState<string>(
        getPhoneNumberWithoutCountryCode(value, getCountryFromValue(value))
    );

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setSelectedCountry(newCountry);
        const callingCode = getCountryCallingCode(newCountry as any);
        const newValue = phoneNumber ? `+${callingCode}${phoneNumber}` : `+${callingCode}`;
        onChange(newValue);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir números
        const cleanPhone = e.target.value.replace(/\D/g, '');
        
        // Limitar según el país seleccionado
        const maxLength = getPhoneLengthForCountry(selectedCountry);
        const limitedPhone = cleanPhone.slice(0, maxLength);
        
        setPhoneNumber(limitedPhone);
        const callingCode = getCountryCallingCode(selectedCountry as any);
        const newValue = limitedPhone ? `+${callingCode}${limitedPhone}` : `+${callingCode}`;
        onChange(newValue);
    };

    const countries = getCountries();
    const callingCode = getCountryCallingCode(selectedCountry as any);

    // Clases de borde según estado
    const getBorderClasses = () => {
        if (hasError) {
            return 'border border-red-300';
        }
        if (isFocused) {
            return 'border border-blue-500 ring-2 ring-blue-500';
        }
        return 'border border-gray-300';
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => {
        setIsFocused(false);
        if (onBlur) onBlur();
    };

    return (
        <div className={`flex  sm:flex-row rounded-lg overflow-hidden ${getBorderClasses()} ${className}`}>
            {/* Selector de país con bandera y código */}
            <div className="relative flex-shrink-0 border-r border-gray-200" style={{ minWidth: '110px', width: '110px' }}>
                <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="w-full h-full py-2 focus:outline-none transition-colors cursor-pointer bg-white appearance-none border-0"
                    style={{
                        paddingLeft: '0.5rem',
                        paddingRight: '1.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        color: 'transparent',
                    }}
                >
                    {countries.map((country) => {
                        const code = getCountryCallingCode(country);
                        const countryName = (en as any)[country] || country;
                        return (
                            <option key={country} value={country} style={{ color: 'black' }}>
                                {countryName} +{code}
                            </option>
                        );
                    })}
                </select>
                {/* Bandera superpuesta */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                    <img 
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${selectedCountry}.svg`}
                        alt={selectedCountry}
                        className="w-6 h-4"
                    />
                    <span className="text-base">+{callingCode}</span>
                </div>
            </div>

            {/* Input del número de teléfono (solo números) */}
            <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="8888 7777"
                maxLength={getPhoneLengthForCountry(selectedCountry)}
                className="flex-1 min-w-0 px-3 py-2 focus:outline-none transition-colors border-0"
            />
        </div>
    );
};

export default PhoneInputComponent;
