import { formatBalance } from '@polkadot/util';
import { useNavigation } from '@react-navigation/native';
import BigN from 'bignumber.js';
import { BalanceVal } from 'components/BalanceVal';
import { ContainerWithSubHeader } from 'components/ContainerWithSubHeader';
import { BalanceField } from 'components/Field/Balance';
import { SubmitButton } from 'components/SubmitButton';
import useIsSufficientBalance from 'hooks/screen/Home/Staking/useIsSufficientBalance';
import useFreeBalance from 'hooks/screen/useFreeBalance';
import useGetNetworkJson from 'hooks/screen/useGetNetworkJson';
import { ScrollView, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import React, { useCallback, useMemo } from 'react';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import { RootNavigationProps } from 'routes/index';
import ValidatorName from 'components/Staking/ValidatorName';
import { StakingValidatorDetailProps } from 'routes/staking/stakingScreen';
import { RootState } from 'stores/index';
import { ColorMap } from 'styles/color';
import {
  ContainerHorizontalPadding,
  FontBold,
  FontMedium,
  FontSemiBold,
  MarginBottomForSubmitButton,
  sharedStyles,
} from 'styles/sharedStyles';
import { BN_TEN, parseBalanceString } from 'utils/chainBalances';
import i18n from 'utils/i18n/i18n';

const WrapperStyle: StyleProp<ViewStyle> = {
  ...ContainerHorizontalPadding,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  paddingTop: 22,
};

const ScrollViewStyle: StyleProp<ViewStyle> = {
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const CenterWrapperStyle: StyleProp<ViewStyle> = {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',
  flexDirection: 'row',
};

const TotalStakeTitleTextStyle: StyleProp<TextStyle> = {
  ...sharedStyles.mainText,
  ...FontMedium,
  color: ColorMap.disabled,
};

const TotalStakeValTextStyle: StyleProp<TextStyle> = {
  ...FontBold,
  fontSize: 40,
  lineHeight: 56,
  marginBottom: 32,
};

const HeaderWrapperStyle: StyleProp<ViewStyle> = {
  flexDirection: 'row',
  justifyContent: 'center',
  flex: 1,
};

const HeaderContentStyle: StyleProp<ViewStyle> = {
  flexDirection: 'row',
  justifyContent: 'center',
  width: '80%',
};

const HeaderTextStyle: StyleProp<TextStyle> = {
  ...sharedStyles.mediumText,
  ...FontSemiBold,
  color: ColorMap.light,
};

const checkCurrentlyBonded = (bondedValidators: string[], validatorAddress: string): boolean => {
  let isBonded = false;

  bondedValidators.forEach(bondedValidator => {
    if (bondedValidator.toLowerCase() === validatorAddress.toLowerCase()) {
      isBonded = true;
    }
  });

  return isBonded;
};

const StakingValidatorDetail = ({
  route: {
    params: { validatorInfo, networkValidatorsInfo, networkKey },
  },
  navigation: { goBack },
}: StakingValidatorDetailProps) => {
  const { bondedValidators, maxNominations, maxNominatorPerValidator } = networkValidatorsInfo;

  const navigation = useNavigation<RootNavigationProps>();
  const toast = useToast();

  const network = useGetNetworkJson(networkKey);

  const token = useMemo((): string => network.nativeToken || 'Token', [network.nativeToken]);

  const isCurrentlyBonded = useMemo(
    (): boolean => checkCurrentlyBonded(bondedValidators, validatorInfo.address),
    [bondedValidators, validatorInfo.address],
  );

  const isOversubscribed = useMemo(
    (): boolean => validatorInfo.nominatorCount >= maxNominatorPerValidator,
    [maxNominatorPerValidator, validatorInfo.nominatorCount],
  );

  const isSufficientFund = useIsSufficientBalance(networkKey, validatorInfo.minBond);

  const hasOwnStake = useMemo((): boolean => validatorInfo.ownStake > 0, [validatorInfo.ownStake]);
  const isMaxCommission = useMemo((): boolean => validatorInfo.commission === 100, [validatorInfo.commission]);

  const show = useCallback(
    (text: string) => {
      toast.hideAll();
      toast.show(text);
    },
    [toast],
  );

  const headerContent = useCallback((): JSX.Element => {
    return (
      <View style={HeaderWrapperStyle}>
        <View style={HeaderContentStyle}>
          <ValidatorName
            validatorInfo={validatorInfo}
            onlyVerifiedIcon={true}
            textStyle={HeaderTextStyle}
            iconColor={ColorMap.primary}
            iconSize={20}
          />
        </View>
      </View>
    );
  }, [validatorInfo]);

  const handlePressStaking = useCallback((): void => {
    if (validatorInfo.hasScheduledRequest) {
      show('Please withdraw the unstaking amount first');

      return;
    }

    if (!isSufficientFund && !isCurrentlyBonded) {
      show(
        `Your free balance needs to be at least ${parseBalanceString(
          validatorInfo.minBond,
          token,
        )}.`,
      );

      return;
    }

    if (bondedValidators.length >= maxNominations && !bondedValidators.includes(validatorInfo.address)) {
      show('Please choose among the nominating validators only');

      return;
    }

    navigation.navigate('StakeAction', {
      screen: 'StakeConfirm',
      params: {
        validator: validatorInfo,
        networkKey: networkKey,
        networkValidatorsInfo: networkValidatorsInfo,
      },
    });
  }, [
    validatorInfo,
    isSufficientFund,
    isCurrentlyBonded,
    bondedValidators,
    maxNominations,
    navigation,
    networkKey,
    networkValidatorsInfo,
    show,
    token,
  ]);

  return (
    <ContainerWithSubHeader onPressBack={goBack} headerContent={headerContent}>
      <View style={WrapperStyle}>
        <ScrollView style={ScrollViewStyle}>
          <View style={CenterWrapperStyle}>
            <Text style={TotalStakeTitleTextStyle}>Total Stake</Text>
          </View>
          <View style={CenterWrapperStyle}>
            <BalanceVal
              balanceValTextStyle={TotalStakeValTextStyle}
              // symbolTextStyle={BalanceSymbolTextStyle}
              symbol={token}
              withComma={true}
              value={new BigN(validatorInfo.totalStake)}
            />
          </View>
          <BalanceField
            label={i18n.stakingScreen.validatorDetail.expected}
            value={validatorInfo.expectedReturn.toString() || '0'}
            token={'%'}
            decimal={0}
            si={formatBalance.findSi('-')}
            color={ColorMap.primary}
          />
          <BalanceField
            label={i18n.stakingScreen.validatorDetail.ownStake}
            value={validatorInfo.ownStake.toString() || '0'}
            token={token}
            decimal={0}
            si={formatBalance.findSi('-')}
            color={hasOwnStake ? ColorMap.warning : ColorMap.light}
          />
          <BalanceField
            label={i18n.stakingScreen.validatorDetail.nominatorsCount}
            value={validatorInfo.nominatorCount.toString() || '0'}
            token={''}
            decimal={0}
            si={formatBalance.findSi('-')}
            color={isOversubscribed ? ColorMap.errorColor : ColorMap.light}
          />
          <BalanceField
            label={i18n.stakingScreen.validatorDetail.minimumStake}
            value={validatorInfo.minBond.toString() || '0'}
            token={token}
            decimal={0}
            si={formatBalance.findSi('-')}
            color={isSufficientFund ? ColorMap.primary : ColorMap.danger}
          />
          <BalanceField
            label={i18n.stakingScreen.validatorDetail.commission}
            value={validatorInfo.commission.toString() || '0'}
            token={'%'}
            decimal={0}
            si={formatBalance.findSi('-')}
            color={!isMaxCommission ? ColorMap.primary : ColorMap.danger}
          />
        </ScrollView>
        <View style={{ ...MarginBottomForSubmitButton, paddingTop: 16 }}>
          <SubmitButton
            title={i18n.stakingScreen.startStaking}
            backgroundColor={ColorMap.secondary}
            onPress={handlePressStaking}
          />
        </View>
      </View>
    </ContainerWithSubHeader>
  );
};

export default React.memo(StakingValidatorDetail);