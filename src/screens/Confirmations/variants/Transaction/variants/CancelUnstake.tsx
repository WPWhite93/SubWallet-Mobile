// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestStakeCancelWithdrawal } from '@subwallet/extension-base/background/KoniTypes';
import { CommonTransactionInfo } from 'components/common/Confirmation/CommonTransactionInfo';
import MetaInfo from 'components/MetaInfo';
import useGetNativeTokenBasicInfo from 'hooks/useGetNativeTokenBasicInfo';
import React from 'react';
import { View } from 'react-native';
import i18n from 'utils/i18n/i18n';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const CancelUnstakeTransactionConfirmation: React.FC<Props> = (props: Props) => {
  const { transaction } = props;
  const data = transaction.data as RequestStakeCancelWithdrawal;

  const { decimals, symbol } = useGetNativeTokenBasicInfo(data.chain);

  return (
    <View>
      <CommonTransactionInfo address={transaction.address} network={transaction.chain} />
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Number
          decimals={decimals}
          label={i18n.common.amount}
          suffix={symbol}
          value={data.selectedUnstaking.claimable}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={'Cancel unstake fee'}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </View>
  );
};

export default CancelUnstakeTransactionConfirmation;