interface PhotoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: string | null;
}

export function applyPhotoFilters({ brightness, contrast, saturation, filter }: PhotoFilters): React.CSSProperties {
  let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  if (filter) {
    switch (filter) {
      case 'vintage':
        filterString += ' sepia(30%) contrast(110%) brightness(110%) hue-rotate(-10deg)';
        break;
      case 'warm':
        filterString += ' hue-rotate(-20deg) brightness(110%) saturate(120%)';
        break;
      case 'cool':
        filterString += ' hue-rotate(20deg) brightness(100%) saturate(110%)';
        break;
      case 'grayscale':
        filterString += ' grayscale(100%)';
        break;
      case 'sepia':
        filterString += ' sepia(100%) hue-rotate(-30deg) saturate(150%)';
        break;
      case 'drama':
        filterString += ' contrast(150%) brightness(90%) saturate(130%) hue-rotate(-5deg)';
        break;
    }
  }

  return {
    filter: filterString,
    transition: 'filter 0.3s ease',
  };
}
