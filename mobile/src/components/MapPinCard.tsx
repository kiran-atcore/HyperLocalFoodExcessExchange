export const generateMapPinCardHtml = (
  sortedGroup: any[],
  distStr: string,
  safeDonor: string,
  groupId: string
) => {
  let itemsHtml = '';

  sortedGroup.forEach((item) => {
    const isExpanded = false;
    const safeTitle = (item.title || '')
      .replace(/'/g, "\\'")
      .replace(/\n|\r/g, ' ');

    const isDonation = item.listing_type === 'DONATION';
    const isClaimed =
      item.is_claimed ||
      (item.quantity_remaining !== undefined && item.quantity_remaining <= 0);

    const badgeHtml = isDonation
      ? '<span style="font-size: 9px; font-weight: 800; background: rgba(13, 148, 136, 0.22); color: #5EEAD4; border: 1px solid rgba(94, 234, 212, 0.4); padding: 2px 7px; border-radius: 6px; display: inline-block; letter-spacing: 0.4px;">NGO DONATION</span>'
      : '<span style="font-size: 9px; font-weight: 800; background: rgba(13, 148, 136, 0.22); color: #5EEAD4; border: 1px solid rgba(94, 234, 212, 0.4); padding: 2px 7px; border-radius: 6px; display: inline-block; letter-spacing: 0.4px;">DISCOUNT SURPLUS</span>';

    const buttonText = isClaimed
      ? 'Already Claimed'
      : isDonation
      ? 'Claim for NGO'
      : 'Buy Now';

    const buttonGradient = isClaimed
      ? 'background: #1E293B; color: #64748B; cursor: not-allowed; border: 1px solid rgba(255, 255, 255, 0.08);'
      : isDonation
      ? 'background: linear-gradient(135deg, #042F2E 0%, #0D9488 100%); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.2);'
      : 'background: linear-gradient(135deg, #0D9488 0%, #042F2E 100%); color: #FFFFFF; border: 1px solid rgba(94, 234, 212, 0.4); box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);';

    const origPrice = Number(item.original_price) || 0;
    const discPrice = Number(item.discounted_price) || 0;
    const displayPrice = isDonation
      ? '<span style="color: #10B981; font-weight: 900; font-size: 15px; letter-spacing: 0.3px;">100% FREE</span>'
      : `<span style="color: #5EEAD4; font-weight: 900; font-size: 16px;">₹${discPrice}</span>${
          origPrice > discPrice
            ? ` <span style="color: #64748B; text-decoration: line-through; font-size: 11px; margin-left: 4px;">₹${origPrice}</span>`
            : ''
        }`;

    const qtyCount =
      item.quantity_remaining !== undefined
        ? item.quantity_remaining
        : item.quantity_available !== undefined
        ? item.quantity_available
        : '';
    const qtyStr =
      qtyCount !== ''
        ? `<div style="color: #38BDF8; font-size: 11px; font-weight: 700; margin: 4px 0 6px 0;">📦 ${qtyCount} ${
            item.quantity_unit || 'portions'
          }${!isDonation ? ' left' : ''}</div>`
        : '';

    const imageUrl = item.image_url || item.food_image || item.image;
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255, 255, 255, 0.1);" />`
      : '';

    itemsHtml += `
      <div id="item_container_${item.id}" style="border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; margin-bottom: 8px; overflow: hidden; background: rgba(15, 23, 42, 0.85); text-align: left;">
        <div onclick="toggleAccordion(event, '${groupId}', ${item.id})" style="background: rgba(255, 255, 255, 0.04); padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
          <div style="font-size: 13px; font-weight: 700; color: #F8FAFC; padding-right: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;">${safeTitle}</div>
          <span id="icon_${item.id}" style="font-size: 15px; color: #5EEAD4; font-weight: 800; min-width: 14px; text-align: center;">${isExpanded ? '−' : '+'}</span>
        </div>
        <div class="group_${groupId}" id="content_${item.id}" style="padding: 12px; display: ${isExpanded ? 'block' : 'none'}; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.95);">
          ${imageHtml}
          <div style="margin-bottom: 6px;">${badgeHtml}</div>
          <div style="margin-bottom: 4px;">${displayPrice}</div>
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px; padding: 3px 8px; display: inline-block; margin: 4px 0;">
            <small class="countdown-timer" data-expires="${item.pickup_end || ''}" style="color: #F59E0B; font-weight: 700; font-size: 11px;">Calculating...</small>
          </div>
          ${qtyStr}
          <div onclick="handleCardClick(${item.id})" style="color: #5EEAD4; font-size: 11px; font-weight: 700; margin: 4px 0 8px 0; cursor: pointer; text-decoration: none;">View Details →</div>
          <button ${item.is_claimed ? 'disabled' : ''} onclick="event.stopPropagation(); handleClaimClick(${item.id})" style="width: 100%; border: none; padding: 9px 12px; ${buttonGradient} border-radius: 8px; font-weight: 800; font-size: 12px; letter-spacing: 0.3px; cursor: pointer;">${buttonText}</button>
        </div>
      </div>
    `;
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; cursor: default; width: 235px; max-height: 330px; overflow-y: auto; overflow-x: hidden; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
        <span style="font-size: 14px;">🏪</span>
        <b style="font-size: 15px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">${safeDonor}</b>
      </div>
      <small style="color: #5EEAD4; font-weight: 700; display: inline-block; font-size: 11px; margin-bottom: 12px; background: rgba(94, 234, 212, 0.12); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(94, 234, 212, 0.25);">📍 ${distStr}</small>
      ${itemsHtml}
    </div>
  `.replace(/\n|\r/g, ' ');
};
