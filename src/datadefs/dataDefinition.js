function identity(d) {
  return d;
}

export default function dataDefinition(props) {
  return {
    ...props,
    longLabel: props.longLabel || props.label,
    formatter: props.formatter || identity,
    shortFormatter: props.shortFormatter || props.formatter || identity,
  };
}
