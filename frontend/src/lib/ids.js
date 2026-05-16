export function createLocalId() {
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`); 
}
