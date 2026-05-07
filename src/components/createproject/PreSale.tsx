import CrowdfundingDetails from './crowdfunding-details';
import CrowdfundingSymbolSection from './crowdfunding-symbol-section';

function PreSaleProject() {
  return <CrowdfundingDetails title="Security Token Crowdfunding Details" />;
}

export default function PreSale() {
  return <CrowdfundingSymbolSection CrowdfundingComponent={PreSaleProject} />;
}
