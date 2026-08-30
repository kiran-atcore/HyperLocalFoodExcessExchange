export const generateMapPinCardHtml = (sortedGroup: any[], distStr: string, safeDonor: string, groupId: string) => {
    let itemsHtml = '';
    
    sortedGroup.forEach((item, index) => {
      const isExpanded = false;
      const safeTitle = (item.title || '').replace(/'/g, "\\'").replace(/\n|\r/g, ' ');
      
      // We check for DONATION vs DISCOUNT based on listing_type, or default to DISCOUNT logic if missing
      const isDonation = item.listing_type === 'DONATION';
      const color = isDonation ? '#3b82f6' : '#10b981';
      
      let badgeHtml = '';
      if (isDonation) {
        badgeHtml = '<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; display: inline-block;">NGO Donation</span>';
      } else {
        badgeHtml = '<span style="font-size: 10px; background: #dcfce7; color: #065f46; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; display: inline-block;">Discounted Surplus</span>';
      }
      
      const buttonText = item.is_claimed ? 'Already Claimed' : (isDonation ? 'Claim for NGO' : 'Buy Now');
      const displayPrice = isDonation ? 'FREE' : (item.discounted_price ? `₹${Number(item.discounted_price).toFixed(2)}` : 'FREE');
      
      const qtyCount = item.quantity_available !== undefined ? item.quantity_available : (item.quantity_remaining !== undefined ? item.quantity_remaining : '');
      const qtyStr = qtyCount !== '' ? `<small style="color: #64748b;">Qty: ${qtyCount} ${item.quantity_unit || 'portions'}</small><br/>` : '';

      itemsHtml += `
        <div id="item_container_${item.id}" style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; overflow: hidden; text-align: left;">
          <div onclick="toggleAccordion(event, '${groupId}', ${item.id})" style="background: #f8fafc; padding: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <b style="font-size: 14px; margin: 0; padding-right: 8px; font-family: sans-serif; color: #0f172a;">${safeTitle}</b>
            <span id="icon_${item.id}" style="font-size: 16px; color: #64748b; line-height: 1; min-width: 12px; text-align: center;">${isExpanded ? '−' : '+'}</span>
          </div>
          <div class="group_${groupId}" id="content_${item.id}" style="padding: 10px; display: ${isExpanded ? 'block' : 'none'}; text-align: center; border-top: 1px solid #e2e8f0;">
            <div onclick="handleCardClick(${item.id})" style="color: #3b82f6; text-decoration: underline; font-size: 13px; margin-bottom: 8px; cursor: pointer;">View Details</div>
            ${badgeHtml}<br/>
            <span style="color: ${color}; font-weight: bold; font-size: 14px;">${displayPrice}</span><br/>
            <small class="countdown-timer" data-expires="${item.pickup_end || ''}" style="color: #f59e0b; font-weight: bold;">Calculating time...</small><br/>
            ${qtyStr}
            <button ${item.is_claimed ? 'disabled' : ''} onclick="event.stopPropagation(); handleClaimClick(${item.id})" style="width: 100%; border: none; margin-top: 8px; padding: 8px; background: ${item.is_claimed ? '#94a3b8' : color}; color: white; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer;">${buttonText}</button>
          </div>
        </div>
      `;
    });

    return `
      <div style="font-family: sans-serif; text-align: center; cursor: default; width: 220px; max-height: 300px; overflow-y: auto; overflow-x: hidden;">
        <b style="font-size: 16px; margin-bottom: 2px; display: block; color: #0f172a;">${safeDonor}</b>
        <small style="color: #64748b; font-weight: bold; display: block; margin-bottom: 12px;">${distStr}</small>
        ${itemsHtml}
      </div>
    `.replace(/\n|\r/g, ' ');
};
