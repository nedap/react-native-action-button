import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
  StyleSheet,
  View,
  Animated,
  TouchableOpacity
} from "react-native";
import ActionButtonItem from "./ActionButtonItem";
import {
  shadowStyle as defaultShadowStyle,
  alignItemsMap,
  getTouchableComponent,
  isAndroid,
  touchableBackground,
  DEFAULT_ACTIVE_OPACITY
} from "./shared";

const getDefaultProps = () => ({
  // State & Control
  resetToken: null,
  active: false,
  autoInactive: true,

  // Layout & Positioning
  position: "right",
  verticalOrientation: "up",
  size: 56,
  offsetX: 30,
  offsetY: 30,
  spacing: 20,

  // Styling
  bgColor: "transparent",
  bgOpacity: 1,
  backdrop: false,
  buttonColor: "rgba(0,0,0,1)",
  buttonText: "+",
  buttonTextStyle: {},

  // Animation
  degrees: 45,
  outRangeScale: 1,

  // Touch & Interaction
  useNativeFeedback: true,
  fixNativeFeedbackRadius: false,
  nativeFeedbackRippleColor: "rgba(255,255,255,0.75)",
  activeOpacity: DEFAULT_ACTIVE_OPACITY,
  backgroundTappable: false,

  // Event Handlers
  onPress: () => { },
  onPressIn: () => { },
  onPressOut: () => { },

  // Accessibility
  testID: undefined,
  accessibilityLabel: undefined,
  accessible: undefined
});

const ActionButton = (props) => {
  const mergedProps = { ...getDefaultProps(), ...props }

  const {
    // State & Control
    resetToken, active, autoInactive,

    // Layout & Positioning
    position, verticalOrientation, size,
    offsetX, offsetY, spacing,
    elevation, zIndex,

    // Styling
    bgColor, bgOpacity, backdrop,
    buttonColor, btnOutRange, btnOutRangeTxt,
    buttonText, buttonTextStyle,
    hideShadow, shadowStyle, style,

    // Animation
    degrees, outRangeScale,

    // Touch & Interaction
    useNativeFeedback, fixNativeFeedbackRadius,
    nativeFeedbackRippleColor, activeOpacity,
    backgroundTappable,

    // Event Handlers
    onPress, onPressIn, onPressOut,
    onReset, onLongPress, onBackdropPress,

    // Accessibility
    testID, accessibilityLabel, accessible,

    // Content
    renderIcon, icon, children
  } = mergedProps

  const [, setResetToken] = useState(resetToken);
  const [activeState, setActive] = useState(active);
  const anim = useRef(new Animated.Value(active ? 1 : 0));
  const timeout = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      timeout.current && clearTimeout(timeout.current);
    };
  }, []);

  useEffect(() => {
    if (active) {
      Animated.spring(anim.current, { toValue: 1, useNativeDriver: false }).start();
      setActive(true);
      setResetToken(resetToken);
    } else {
      onReset && onReset();

      Animated.spring(anim.current, { toValue: 0, useNativeDriver: false }).start();
      timeout.current = setTimeout(() => {
        setActive(false);
        setResetToken(resetToken);
      }, 250);
    }
  }, [resetToken, active]);

  //////////////////////
  // STYLESHEET GETTERS
  //////////////////////

  const getOrientation = () => {
    return { alignItems: alignItemsMap[position] };
  };

  const getOffsetXY = () => {
    return {
      // paddingHorizontal: offsetX,
      paddingVertical: offsetY
    };
  };

  const getOverlayStyles = () => {
    return [
      styles.overlay,
      {
        elevation: elevation,
        zIndex: zIndex,
        justifyContent:
          verticalOrientation === "up" ? "flex-end" : "flex-start"
      }
    ];
  };

  const _renderMainButton = () => {
    const animatedViewStyle = {
      transform: [
        {
          scale: anim.current.interpolate({
            inputRange: [0, 1],
            outputRange: [1, outRangeScale]
          })
        },
        {
          rotate: anim.current.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", degrees + "deg"]
          })
        }
      ]
    };

    const wrapperStyle = {
      backgroundColor: anim.current.interpolate({
        inputRange: [0, 1],
        outputRange: [buttonColor, btnOutRange || buttonColor]
      }),
      width: size,
      height: size,
      borderRadius: size / 2
    };

    const buttonStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: "center",
      justifyContent: "center"
    };

    const Touchable = getTouchableComponent(useNativeFeedback);
    const parentStyle =
      isAndroid && fixNativeFeedbackRadius
        ? {
          right: offsetX,
          zIndex: zIndex,
          borderRadius: size / 2,
          width: size
        }
        : { marginHorizontal: offsetX, zIndex: zIndex };

    return (
      <View
        style={[
          parentStyle,
          !hideShadow && defaultShadowStyle,
          !hideShadow && shadowStyle
        ]}
      >
        <Touchable
          testID={testID}
          accessible={accessible}
          accessibilityLabel={accessibilityLabel}
          background={touchableBackground(
            nativeFeedbackRippleColor,
            fixNativeFeedbackRadius
          )}
          activeOpacity={activeOpacity}
          onLongPress={onLongPress}
          onPress={() => {
            onPress();
            if (children) animateButton();
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Animated.View style={wrapperStyle}>
            <Animated.View style={[buttonStyle, animatedViewStyle]}>
              {_renderButtonIcon()}
            </Animated.View>
          </Animated.View>
        </Touchable>
      </View>
    );
  };

  const _renderButtonIcon = () => {
    if (renderIcon) return renderIcon(activeState);
    if (icon) {
      console.warn(
        "react-native-action-button: The `icon` prop is deprecated! Use `renderIcon` instead."
      );
      return icon;
    }

    const textColor = buttonTextStyle.color || "rgba(255,255,255,1)";

    return (
      <Animated.Text
        style={[
          styles.btnText,
          buttonTextStyle,
          {
            color: anim.current.interpolate({
              inputRange: [0, 1],
              outputRange: [textColor, btnOutRangeTxt || textColor]
            })
          }
        ]}
      >
        {buttonText}
      </Animated.Text>
    );
  };

  const _renderActions = () => {
    if (!activeState) return null;

    let actionButtons = !Array.isArray(children) ? [children] : children;

    actionButtons = actionButtons.filter(
      actionButton => typeof actionButton == "object"
    );

    const actionStyle = {
      flex: 1,
      alignSelf: "stretch",
      // backgroundColor: 'purple',
      justifyContent: verticalOrientation === "up" ? "flex-end" : "flex-start",
      paddingTop: verticalOrientation === "down" ? spacing : 0,
      zIndex: zIndex
    };

    return (
      <View style={actionStyle} pointerEvents={"box-none"}>
        {actionButtons.map((ActionButton, idx) => (
          <ActionButtonItem
            key={idx}
            anim={anim.current}
            {...mergedProps}
            {...ActionButton.props}
            parentSize={size}
            btnColor={btnOutRange}
            onPress={() => {
              if (autoInactive) {
                timeout.current = setTimeout(reset, 200);
              }
              ActionButton.props.onPress();
            }}
          />
        ))}
      </View>
    );
  };

  const _renderTappableBackground = () => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={getOverlayStyles()}
        onPress={onBackdropPress || reset}
      />
    );
  };

  //////////////////////
  // Animation Methods
  //////////////////////

  const animateButton = (animate = true) => {
    if (activeState) return reset(animate);

    if (animate) {
      Animated.spring(anim.current, { toValue: 1, useNativeDriver: false }).start();
    } else {
      anim.current.setValue(1);
    }

    setActive(true);
  };

  const reset = (animate = true) => {
    if (onReset) onReset();

    if (animate) {
      Animated.spring(anim.current, { toValue: 0, useNativeDriver: false }).start();
    } else {
      anim.current.setValue(0);
    }

    timeout.current = setTimeout(() => {
      if (mounted.current) {
        setActive(false);
      }
    }, 250);
  };

  return (
    <View pointerEvents="box-none" style={[getOverlayStyles(), style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          getOverlayStyles(),
          {
            backgroundColor: bgColor,
            opacity: anim.current.interpolate({
              inputRange: [0, 1],
              outputRange: [0, bgOpacity]
            })
          }
        ]}
      >
        {backdrop}
      </Animated.View>
      <View
        pointerEvents="box-none"
        style={[getOverlayStyles(), getOrientation(), getOffsetXY()]}
      >
        {activeState && !backgroundTappable && _renderTappableBackground()}

        {verticalOrientation === "up" &&
          children &&
          _renderActions()}
        {_renderMainButton()}
        {verticalOrientation === "down" &&
          children &&
          _renderActions()}
      </View>
    </View>
  );
};

ActionButton.Item = ActionButtonItem;

ActionButton.propTypes = {
  resetToken: PropTypes.any,
  active: PropTypes.bool,

  position: PropTypes.string,
  elevation: PropTypes.number,
  zIndex: PropTypes.number,

  hideShadow: PropTypes.bool,
  shadowStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.number
  ]),

  renderIcon: PropTypes.func,

  bgColor: PropTypes.string,
  bgOpacity: PropTypes.number,
  buttonColor: PropTypes.string,
  buttonTextStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.number
  ]),
  buttonText: PropTypes.string,

  offsetX: PropTypes.number,
  offsetY: PropTypes.number,
  spacing: PropTypes.number,
  size: PropTypes.number,
  autoInactive: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  degrees: PropTypes.number,
  verticalOrientation: PropTypes.oneOf(["up", "down"]),
  backgroundTappable: PropTypes.bool,
  activeOpacity: PropTypes.number,

  useNativeFeedback: PropTypes.bool,
  fixNativeFeedbackRadius: PropTypes.bool,
  nativeFeedbackRippleColor: PropTypes.string,

  testID: PropTypes.string,
  accessibilityLabel: PropTypes.string,
  accessible: PropTypes.bool,
  onBackdropPress: PropTypes.func,
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "transparent"
  },
  btnText: {
    marginTop: -4,
    fontSize: 24,
    backgroundColor: "transparent"
  }
});
export default ActionButton;
