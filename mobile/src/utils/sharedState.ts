export const sharedLocation = {
  lat: null as number | null,
  lng: null as number | null,
  address: ''
};

export const clearSharedLocation = () => {
  sharedLocation.lat = null;
  sharedLocation.lng = null;
  sharedLocation.address = '';
};
