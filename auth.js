(function () {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function isValidE164Phone(phone) {
    return /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim());
  }

  function hasMinimumAge(birthDate, minAge) {
    const ageFloor = Number(minAge || 18);
    if (!birthDate) return false;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age >= ageFloor;
  }

  function getEmailTypoSuggestion(email) {
    const parts = String(email || '').toLowerCase().split('@');
    if (parts.length !== 2) return null;
    const localPart = parts[0];
    const domain = parts[1];
    const domainFixes = {
      'gmil.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmail.con': 'gmail.com',
      'hotnail.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outllok.com': 'outlook.com',
      'yaho.com': 'yahoo.com',
      'yhoo.com': 'yahoo.com'
    };
    const suggestedDomain = domainFixes[domain];
    return suggestedDomain ? `${localPart}@${suggestedDomain}` : null;
  }

  window.EducriAuth = {
    isValidEmail,
    isValidE164Phone,
    hasMinimumAge,
    getEmailTypoSuggestion
  };
})();

